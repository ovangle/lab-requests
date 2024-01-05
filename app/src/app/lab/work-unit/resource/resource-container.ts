import { Injectable } from "@angular/core";
import { Observable, defer, firstValueFrom, map, tap } from "rxjs";
import { ALL_RESOURCE_TYPES, ResourceType } from "./resource-type";

import { EquipmentLease, equipmentLeaseFromJson, equipmentLeaseParamsToJson } from "../resources/equipment/equipment-lease";
import { InputMaterial, InputMaterialParams, inputMaterialFromJson, inputMaterialToJson } from "../resources/input-material/input-material";
import { OutputMaterial, OutputMaterialParams, outputMaterialFromJson, outputMaterialParamsToJson } from "../resources/output-material/output-material";
import { Software, SoftwareParams, softwareFromJson, softwareParamsToJson } from "../resources/software/software";
import { Task, TaskParams, taskFromJson, taskToJson } from "../resources/task/task";

import type { Resource } from './resource';
import { Model, ModelParams, ModelPatch, modelParamsFromJsonObject } from "src/app/common/model/model";
import { ModelContext } from "src/app/common/model/context";
import { ExperimentalPlan } from "../../experimental-plan/common/experimental-plan";

export interface ResourceContainerParams extends ModelParams {
    equipments: EquipmentLease[];
    tasks: Task[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];
}

export abstract class ResourceContainer extends Model {
    equipments: EquipmentLease[];
    tasks: Task[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: ResourceContainerParams) {
        super(params);
        this.equipments = params.equipments.map(e => new EquipmentLease(e));
        this.tasks = params.tasks.map(s => new Task(s));
        this.softwares = params.softwares.map(s => new Software(s));
        this.inputMaterials = params.inputMaterials
            .map(inputMaterial => new InputMaterial(inputMaterial));
        this.outputMaterials = params.outputMaterials
            .map(outputMaterial => new OutputMaterial(outputMaterial));
    }

    getResources<T extends Resource>(t: ResourceType & T[ 'type' ]): readonly T[] {
        return this[ resourceContainerAttr(t) ] as any[];
    }

    countResources(t: ResourceType): number {
        return this.getResources(t).length;
    }

    getResourceAt<T extends Resource>(t: ResourceType & T[ 'type' ], index: number): T {
        const resources = this.getResources(t);
        if (index < 0 || index >= resources.length) {
            throw new Error(`No resource at ${index}`);
        }
        return resources[ index ];
    }
}

export function resourceContainerAttr(type: ResourceType): keyof ResourceContainerPatch<any> {
    return (type.replace(/-([a-z])/, (match) => match[ 1 ].toUpperCase()) + 's') as keyof ResourceContainerPatch<any>;
}

export function resourceContainerFieldsFromJson(json: { [ k: string ]: any }) {
    const baseParams = modelParamsFromJsonObject(json);
    return {
        ...baseParams,
        equipments: Array.from<object>(json[ 'equipments' ]).map(equip => equipmentLeaseFromJson(equip)),
        softwares: Array.from<object>(json[ 'softwares' ]).map(software => softwareFromJson(software)),
        tasks: Array.from<object>(json[ 'tasks' ]).map(task => taskFromJson(task)),

        inputMaterials: Array.from<object>(json[ 'inputMaterials' ]).map(inputMaterial => inputMaterialFromJson(inputMaterial)),
        outputMaterials: Array.from<object>(json[ 'outputMaterials' ]).map(outputMaterial => outputMaterialFromJson(outputMaterial))
    };
}

interface ResourceSplice<T> {
    readonly start: number;
    readonly end?: number;
    readonly items: T[];
}

export interface ResourceContainerPatch<T extends ResourceContainer> extends ModelPatch<T> {
    equipments: ResourceSplice<EquipmentLease>[];
    tasks: ResourceSplice<TaskParams>[];
    softwares: ResourceSplice<SoftwareParams>[];
    inputMaterials: ResourceSplice<InputMaterialParams>[];
    outputMaterials: ResourceSplice<OutputMaterialParams>[];
}

export function resourceContainerPatchToJson(patch: ResourceContainerPatch<any>): { [ k: string ]: any } {
    let json: { [ k: string ]: any } = {};
    for (const resourceType of ALL_RESOURCE_TYPES) {
        const resourceToJson = resourceSerializer(resourceType);

        const slices = patch[ resourceContainerAttr(resourceType) ];

        json[ resourceContainerAttr(resourceType) ] = slices.map(slice => ({
            ...slice,
            items: slice.items.map(item => resourceToJson(item as any))
        }))
    }
    return json;

    function resourceSerializer(resourceType: ResourceType) {
        switch (resourceType) {
            case 'equipment':
                return equipmentLeaseParamsToJson;
            case 'software':
                return softwareParamsToJson;
            case 'task':
                return taskToJson;
            case 'input-material':
                return inputMaterialToJson;
            case 'output-material':
                return outputMaterialParamsToJson;
        }
    }
}

function delResourcePatch<T extends Resource>(
    resourceType: T[ 'type' ] & ResourceType,
    toDel: number[]
): Partial<ResourceContainerPatch<any>> {
    return {
        [ resourceContainerAttr(resourceType) ]: toDel.map(toDel => ({ start: toDel, end: toDel + 1, items: [] }))
    };
}


@Injectable()
export abstract class ResourceContainerContext<
    T extends ResourceContainer,
    TPatch extends ResourceContainerPatch<T>
> {

    abstract commitContext(patch: TPatch): Promise<T>;
    abstract patchFromContainerPatch(patch: ResourceContainerPatch<T>): Promise<TPatch>;
    abstract getContainerPath(): Promise<string[]>;

    abstract committed$: Observable<T>;
    abstract plan$: Observable<ExperimentalPlan>;
    abstract container$: Observable<T>;
    readonly containerName$ = defer(() => this.container$.pipe(
        tap(c => console.log('container', c)),
        map(c => this.getContainerName(c)))
    );

    committedResources$<TResource extends Resource>(resourceType: ResourceType): Observable<readonly TResource[]> {
        return this.committed$.pipe(
            map(committed => committed ? committed.getResources<TResource>(resourceType) : [])
        );
    }

    async commit(patch: TPatch): Promise<T> {
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
            delResourcePatch(resourceType, [ index ]) as TPatch
        );
        return this.commitContext(patch);
    }

    abstract getContainerName(container: T): string;

}