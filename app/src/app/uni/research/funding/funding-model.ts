import { HttpParams } from "@angular/common/http";
import { Injectable, Type, inject, } from "@angular/core";
import { Observable, map } from "rxjs";
import { Model, ModelLookup, ModelMeta, ModelParams, ModelPatch, modelParamsFromJsonObject } from "src/app/common/model/model";
import { RestfulService, modelProviders } from "src/app/common/model/model-service";
import { ResourceType, resourceTypeFromJson } from "src/app/lab/work-unit/resource/resource-type";
import { isJsonObject } from "src/app/utils/is-json-object";

export interface FundingModelParams extends ModelParams {
    name: string;
    description: string;
    requiresSupervisor: boolean;

    /**
     * The work resources captured when 
     */
    readonly capturedResources: ResourceType[];
}

export class FundingModel extends Model {
    readonly name: string;
    readonly description: string;
    readonly requiresSupervisor: boolean;
    readonly capturedResources: ResourceType[];

    constructor(params: FundingModelParams) {
        super(params);
        this.name = params.name!;
        this.description = params.description!;
        this.requiresSupervisor = params.requiresSupervisor!;
        this.capturedResources = params.capturedResources;
    }
}

export function fundingModelParamsFromJson(json: unknown): FundingModelParams {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }
    const baseParams = modelParamsFromJsonObject(json);
    if (typeof json['name'] !== 'string') {
        throw new Error('Expected a string \'name\'');
    }
    if (typeof json['description'] !== 'string') {
        throw new Error('Expected a string \'description\'');
    }
    if (typeof json['requiresSupervisor'] !== 'boolean') {
        throw new Error('Expected a boolean \'requiresSupervisor\'');
    }
    if (!Array.isArray(json['capturedResources'])) {
        throw new Error('Expected an array \'capturedResources\'')
    }
    return {
        ...baseParams,
        name: json['name'],
        description: json['description'],
        requiresSupervisor: json['requiresSupervisor'],
        capturedResources: json['capturedResources'].map(resourceTypeFromJson)
    };
}

export function fundingModelFromJson(json: unknown) {
    return new FundingModel(fundingModelParamsFromJson(json));

}

export interface FundingModelPatch extends ModelPatch<FundingModel> {
    readonly description: string;
    readonly requiresSupervisor: boolean;
}

export function fundingModelPatchToJson(patch: FundingModelPatch) {
    return {
        description: patch.description,
        requiresSupervisor: patch.requiresSupervisor
    };
}

export interface FundingModelLookup extends ModelLookup<FundingModel> {
    // Searches for funding models with this exact name
    name_eq: string;
    // Searches for the instance of this text anywhere in the funding model
    text: string;
}

function fundingModelLookupToHttpParams(lookup: Partial<FundingModelLookup>) {
    return new HttpParams();
}

@Injectable()
export class FundingModelMeta extends ModelMeta<FundingModel, FundingModelPatch, FundingModelLookup> {
    override readonly model = FundingModel;
    override readonly modelParamsFromJson = fundingModelParamsFromJson;
    override readonly modelPatchToJson = fundingModelPatchToJson;
    override readonly lookupToHttpParams = fundingModelLookupToHttpParams;
}

@Injectable()
export class FundingModelService extends RestfulService<FundingModel, FundingModelPatch, FundingModelLookup> {
    override readonly metadata = inject(FundingModelMeta);
    override readonly path: string = '/uni/research/funding';

    getById(id: string): Observable<FundingModel> {
        return this.fetch(id);
    }

    getByName(name: string): Observable<FundingModel> {
        return this.fetch(name);
    }

    fetchByDescription(description: string) {
        return this.fetch(description);
    }

    isNameUnique(name: string): Observable<boolean> {
        return this.queryPage({name_eq: name} as FundingModelLookup).pipe(
            map(page => page.totalItemCount === 0)
        );
    }

    search(input: string): Observable<FundingModel[]> {
        return this.query({text: input});
    }
}

export function uniFundingModelProviders() {
    return modelProviders(FundingModelMeta, FundingModelService);
}