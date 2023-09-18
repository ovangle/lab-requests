import { Injectable, inject } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { Observable, firstValueFrom, map } from "rxjs";
import { ALL_RESOURCE_TYPES, ResourceType } from "./resource-type";

import { EquipmentLease, EquipmentLeaseFormErrors, equipmentLeaseFromJson, equipmentLeaseToJson } from "../resources/equipment/equipment-lease";
import { InputMaterial, InputMaterialFormErrors, inputMaterialFromJson, inputMaterialToJson } from "../resources/material/input/input-material";
import { OutputMaterial, OutputMaterialFormErrors, outputMaterialFromJson, outputMaterialToJson } from "../resources/material/output/output-material";
import { Service, ServiceFormErrors, serviceFromJson, serviceToJson } from "../resources/service/service";
import { Software, SoftwareFormErrors, softwareFromJson, softwareToJson } from "../resources/software/software";

import type { Resource } from './resource';

export abstract class ResourceContainer {
    equipments: EquipmentLease[];
    services: Service[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: Partial<ResourceContainer>) {
        this.equipments = (params.equipments || [])
            .map(e => new EquipmentLease(e));
        this.services = (params.services || [])
            .map(s => new Service(s));
        this.softwares = (params.softwares || [])
            .map(s => new Software(s));
        this.inputMaterials = (params.inputMaterials || [])
            .map(inputMaterial => new InputMaterial(inputMaterial));
        this.outputMaterials = (params.outputMaterials || [])
            .map(outputMaterial => new OutputMaterial(outputMaterial));
    }

    getResources<T extends Resource>(t: ResourceType & T['type']): readonly T[] {
        switch (t) {
            case 'equipment':
                return this.equipments as any[];
            case 'software':
                return this.softwares as any[];
            case 'service':
                return this.services as any[];
            case 'input-material':
                return this.inputMaterials as any[];
            case 'output-material':
                return this.outputMaterials as any[];
            default:
                throw new Error(`Unexpected resource type ${t}`)
        }
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

export function researchContainerFieldsFromJson(json: {[k: string]: any}) {
    return {
        equipments: Array.from<object>(json['equipments']).map(equip => equipmentLeaseFromJson(equip)),
        softwares: Array.from<object>(json['softwares']).map(software => softwareFromJson(software)), 
        services: Array.from<object>(json['services']).map(service => serviceFromJson(service)),

        inputMaterials: Array.from<object>(json['inputMaterials']).map(inputMaterial => inputMaterialFromJson(inputMaterial)),
        outputMaterials: Array.from<object>(json['outputMaterials']).map(outputMaterial => outputMaterialFromJson(outputMaterial))
    };
}

export class ResourceContainerPatch {
    addEquipments?: EquipmentLease[];
    replaceEquipments?: {[k: number]: EquipmentLease | null};
    delEquipments?: number[];

    addServices?: Service[];
    replaceServices?: {[k: number]: Service | null};
    delServices?: number[];

    addSoftwares?: Software[];
    replaceSoftwares?: {[k: number]: Software | null}
    delSoftwares?: number[]

    addInputMaterials?: InputMaterial[]; 
    replaceInputMaterials?: {[k: number]: InputMaterial | null};
    delInputMaterials?: number[]

    addOutputMaterials?: OutputMaterial[];
    replaceOutputMaterials?: {[k: number]: OutputMaterial | null};
    delOutputMaterials?: number[]
}

export function resourceContainerPatchFromContainer(container: any) {
    return {};
}

export function resourceContainerPatchToJson(patch: ResourceContainerPatch): {[k: string]: any} {
    let json: {[k: string]: any} = {};
    for (const resourceType of ALL_RESOURCE_TYPES) {
        contributeResourceFieldsToOutput(resourceType);
    }
    return json;

    function resourceSerializer(resourceType: ResourceType) {
        switch (resourceType) {
            case 'equipment':
                return equipmentLeaseToJson;
            case 'software':
                return softwareToJson;
            case 'service':
                return serviceToJson;
            case 'input-material':
                return inputMaterialToJson;
            case 'output-material':
                return outputMaterialToJson;
        }
    }

    function getFieldSuffix(resourceType: ResourceType) {
        switch (resourceType) {
            case 'equipment':
                return 'Equipments';
            case 'software':
                return 'Softwares';
            case 'service':
                return 'Services';
            case 'input-material':
                return 'InputMaterials';
            case 'output-material':
                return 'OutputMaterials';
        }
    }

    function contributeResourceFieldsToOutput(resourceType: ResourceType) {
        const resourceToJson = resourceSerializer(resourceType);
        const fieldSuffix = getFieldSuffix(resourceType);

        const addField: keyof ResourceContainerPatch = `add${fieldSuffix}`;
        if (addField in Object.keys(patch)) {
            json[addField] = patch[addField]!.map((item) => resourceToJson(item as any));
        }

        const replaceField: keyof ResourceContainerPatch = `replace${fieldSuffix}`;
        if (replaceField in Object.keys(patch)) {
            const replaceEntries = Object.entries(patch[replaceField]!).map(
                ([k, v]) => [k, resourceToJson(v)]
            );
            json[replaceField] = Object.fromEntries(replaceEntries);
        }

        const delField: keyof ResourceContainerPatch = `del${fieldSuffix}`;
        if (delField in Object.keys(patch)) {
            json[delField] = patch[delField];
        }
    }
}

function delResourcePatch(resourceType: ResourceType, toDel: number[]): ResourceContainerPatch {
    switch (resourceType) {
        case 'equipment':
            return {delEquipments: toDel}
        case 'service':
            return {delServices: toDel}
        case 'software':
            return {delSoftwares: toDel}
        case 'input-material':
            return {delInputMaterials: toDel}
        case 'output-material':
            return {delOutputMaterials: toDel}
    }
}

export type ResourceContainerPatchErrors = ValidationErrors & {
    addEquipments?: (EquipmentLeaseFormErrors | null)[];
    replaceEquipments?: {[k: string]: EquipmentLeaseFormErrors };

    addSoftwares?: (SoftwareFormErrors | null)[];
    replaceSoftwares?: {[k: string]: SoftwareFormErrors };

    addServices?: (ServiceFormErrors | null)[];
    replaceServices?: {[k: string]: ServiceFormErrors };

    addInputMaterials?: (InputMaterialFormErrors | null)[];
    replaceInputMaterials?: {[k: string]: InputMaterialFormErrors };

    addOutputMaterials?: (OutputMaterialFormErrors | null)[];
    replaceOutputMaterials?: {[k: string]: OutputMaterialFormErrors };
}

@Injectable()
export abstract class ResourceContainerContext<T extends ResourceContainer & { readonly id: string; }, TPatch> {
    abstract readonly committed$: Observable<T | null>;

    abstract commitContext(patch: TPatch): Promise<T>;
    abstract patchFromContainerPatch(patch: ResourceContainerPatch): Promise<TPatch>;
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