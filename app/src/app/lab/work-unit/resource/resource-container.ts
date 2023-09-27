import { Injectable, inject } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { Observable, firstValueFrom, map } from "rxjs";
import { ALL_RESOURCE_TYPES, ResourceType } from "./resource-type";

import { EquipmentLease, EquipmentLeaseFormErrors, equipmentLeaseFromJson, equipmentLeaseToJson } from "../resources/equipment/equipment-lease";
import { InputMaterial, InputMaterialFormErrors, inputMaterialFromJson, inputMaterialToJson } from "../resources/material/input/input-material";
import { OutputMaterial, OutputMaterialFormErrors, outputMaterialFromJson, outputMaterialToJson } from "../resources/material/output/output-material";
import { Task, TaskFormErrors, taskFromJson, taskToJson } from "../resources/task/task";
import { Software, SoftwareFormErrors, softwareFromJson, softwareToJson } from "../resources/software/software";

import type { Resource } from './resource';
import { startOfDay } from "date-fns";

export abstract class ResourceContainer {
    equipments: EquipmentLease[];
    tasks: Task[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: Partial<ResourceContainer>) {
        this.equipments = (params.equipments || [])
            .map(e => new EquipmentLease(e));
        this.tasks = (params.tasks || [])
            .map(s => new Task(s));
        this.softwares = (params.softwares || [])
            .map(s => new Software(s));
        this.inputMaterials = (params.inputMaterials || [])
            .map(inputMaterial => new InputMaterial(inputMaterial));
        this.outputMaterials = (params.outputMaterials || [])
            .map(outputMaterial => new OutputMaterial(outputMaterial));
    }

    getResources<T extends Resource>(t: ResourceType & T['type']): readonly T[] {
        return this[resourceContainerAttr(t)] as any[];
    }

    countResources(t: ResourceType): number {
        return this.getResources(t).length;
    }

    getResourceAt<T extends Resource>(t: ResourceType & T['type'], index: number): T {
        const resources = this.getResources(t);
        if (index < 0 || index >= resources.length) {
            throw new Error(`No resource at ${index}`);
        }
        return resources[index];
    }
}

export function resourceContainerAttr(type: ResourceType): keyof ResourceContainerPatch {
    return (type.replace(/-([a-z])/, (match) => match[1].toUpperCase()) + 's') as keyof ResourceContainerPatch;
}

export function researchContainerFieldsFromJson(json: {[k: string]: any}) {
    return {
        equipments: Array.from<object>(json['equipments']).map(equip => equipmentLeaseFromJson(equip)),
        softwares: Array.from<object>(json['softwares']).map(software => softwareFromJson(software)), 
        services: Array.from<object>(json['services']).map(service => taskFromJson(service)),

        inputMaterials: Array.from<object>(json['inputMaterials']).map(inputMaterial => inputMaterialFromJson(inputMaterial)),
        outputMaterials: Array.from<object>(json['outputMaterials']).map(outputMaterial => outputMaterialFromJson(outputMaterial))
    };
}

interface ResourceSplice<T> {
    readonly start: number;
    readonly end?: number;
    readonly items: T[];
}

export class ResourceContainerPatch {
    equipments: ResourceSplice<EquipmentLease>[];
    tasks: ResourceSplice<Task>[];
    softwares: ResourceSplice<Software>[];
    inputMaterials: ResourceSplice<InputMaterial>[];
    outputMaterials: ResourceSplice<OutputMaterial>[];
}

export function resourceContainerPatchToJson(patch: ResourceContainerPatch): {[k: string]: any} {
    let json: {[k: string]: any} = {};
    for (const resourceType of ALL_RESOURCE_TYPES) {
        const resourceToJson = resourceSerializer(resourceType);

        const slices = patch[resourceContainerAttr(resourceType)];

        json[resourceContainerAttr(resourceType)] = slices.map(slice => ({
            ...slice,
            items: slice.items.map(item => resourceToJson(item as any))
        }))
    }
    return json;

    function resourceSerializer(resourceType: ResourceType) {
        switch (resourceType) {
            case 'equipment':
                return equipmentLeaseToJson;
            case 'software':
                return softwareToJson;
            case 'task':
                return taskToJson;
            case 'input-material':
                return inputMaterialToJson;
            case 'output-material':
                return outputMaterialToJson;
        }
    }
}

function delResourcePatch<T extends Resource>(
    resourceType: T['type'] & ResourceType, 
    toDel: number[]
): Partial<ResourceContainerPatch> {
    return {
        [resourceContainerAttr(resourceType)]: toDel.map(toDel => ({start: toDel, end: toDel + 1, items: []}))
    };
}


@Injectable()
export abstract class ResourceContainerContext<T extends ResourceContainer & { readonly id: string; }, TPatch> {
    abstract readonly committed$: Observable<T | null>;

    abstract commitContext(patch: TPatch): Promise<T>;
    abstract patchFromContainerPatch(patch: Partial<ResourceContainerPatch>): Promise<TPatch>;
    abstract getContainerPath(): Promise<string[]>;

    committedResources$<TResource extends Resource>(resourceType: ResourceType): Observable<readonly TResource[]> {
        return this.committed$.pipe(
            map(committed => committed ? committed.getResources<TResource>(resourceType) : [])
        );
    }

    async commit(patch: ResourceContainerPatch): Promise<T> {
        const committed = await firstValueFrom(this.committed$);
        if (!committed) {
            throw new Error('Cannot commit resources until container exists');
        }
        return this.commitContext(await this.patchFromContainerPatch(patch));
    }
    
    async deleteResourceAt(resourceType: ResourceType, index: number) {
        const committed = await firstValueFrom(this.committed$);
        if (committed == null) {
            throw new Error('Cannot delete resources until container')
        }
        const patch = await this.patchFromContainerPatch(
            delResourcePatch(resourceType, [index])
        );
        return this.commitContext(patch);
    }

}