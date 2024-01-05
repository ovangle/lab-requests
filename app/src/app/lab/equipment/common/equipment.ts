import { Model, ModelLookup, ModelMeta, ModelParams, ModelPatch, modelLookupToHttpParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { LabType } from "../../type/lab-type";
import { Injectable, Provider, inject } from "@angular/core";
import { RestfulService, modelProviders } from "src/app/common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { ModelContext } from "src/app/common/model/context";
import { ModelCollection, injectModelUpdate } from "src/app/common/model/model-collection";
import { defer } from "rxjs";

export class Equipment extends Model {
    name: string;
    description: string;

    tags: string[];

    trainingDescriptions: string[]

    constructor(params: EquipmentParams & { readonly id: string }) {
        super(params);
        this.name = params.name!;
        this.description = params.description!;
        this.tags = Array.from(params.tags!);
        this.trainingDescriptions = Array.from(params.trainingDescriptions!);
    }
}

export interface EquipmentParams extends ModelParams {
    name: string;
    description: string;
    tags: string[];
    trainingDescriptions: string[];
}

export function equipmentParamsFromJson(json: unknown): EquipmentParams {
    if (typeof json !== 'object' || json == null) {
        throw new Error('Expected an object');
    }
    const obj: { [ k: string ]: unknown } = json as any;

    const baseParams = modelParamsFromJsonObject(obj);

    if (typeof obj[ 'name' ] !== 'string') {
        throw new Error('Expected a string \'name\'');
    }

    return {
        ...baseParams,
        name: obj[ 'name' ],
        description: obj[ 'description' ] as string,
        tags: Array.from(obj[ 'tags' ] as any[]),
        trainingDescriptions: Array.from(obj[ 'trainingDescriptions' ] as any[])
    }
}

export interface EquipmentPatch extends ModelPatch<Equipment> {
    name: string;
    description: string;
    tags: string[];
    availableInLabTypes: LabType[];
    trainingDescriptions: string[];
}

export function equipmentPatchToJson(patch: EquipmentPatch): { [ k: string ]: unknown } {
    return { ...patch };
}

export interface EquipmentLookup extends ModelLookup<Equipment> {
    name?: string;
    searchText?: string;
}

export function equipmentLookupToHttpParams(lookup: Partial<EquipmentLookup>) {
    let params = modelLookupToHttpParams(lookup);
    if (lookup.name) {
        params = params.set('name', lookup.name);
    }
    if (lookup.searchText) {
        params = params.set('search', lookup.searchText);
    }
    return params;
}

@Injectable({ providedIn: 'root' })
export class EquipmentMeta extends ModelMeta<Equipment, EquipmentPatch, EquipmentLookup> {
    override readonly model = Equipment;
    override readonly modelParamsFromJson = equipmentParamsFromJson;
    override readonly modelPatchToJson = equipmentPatchToJson;
    override readonly lookupToHttpParams = equipmentLookupToHttpParams;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService extends RestfulService<Equipment, EquipmentPatch, EquipmentLookup> {
    override readonly path = '/lab/equipments'
    override readonly metadata = inject(EquipmentMeta);
}

@Injectable({ providedIn: 'root' })
export class EquipmentCollection extends ModelCollection<Equipment> {
    override readonly service = inject(EquipmentService);
}

@Injectable()
export class EquipmentContext extends ModelContext<Equipment, EquipmentPatch> {
    override readonly _doUpdate = injectModelUpdate(EquipmentService, EquipmentCollection);
    readonly equipment$ = defer(() => this.committed$);
}
