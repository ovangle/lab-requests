import { Injectable, inject } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

import { ModelService } from "src/app/utils/models/model-service";

export class FundingModel {
    readonly id: string;
    readonly description: string;
    readonly requiresSupervisor: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(instance: FundingModel) {
        this.id = instance.id;
        this.description = instance.description;
        this.requiresSupervisor = instance.requiresSupervisor;
        this.createdAt = instance.createdAt;
        this.updatedAt = instance.updatedAt;
    }
}

export function fundingModelFromJson(json: {[k: string]: any}): FundingModel {
    return {
        id: json['id'],
        description: json['description'],
        requiresSupervisor: json['requiresSupervisor'],
        createdAt: json['createdAt'],
        updatedAt: json['updatedAt']
    };
}

export interface FundingModelPatch {
    readonly description: string;
    readonly requiresSupervisor: boolean;
}

export function fundingModelPatchToJson(patch: FundingModelPatch) {
    return {
        description: patch.description,
        requiresSupervisor: patch.requiresSupervisor
    };
}

export interface FundingModelCreate extends FundingModelPatch {}
export function fundingModelCreateToJson(create: FundingModelCreate) {
    return fundingModelPatchToJson(create);
}

export const GRANT: FundingModel = new FundingModel({
    id: 'unknown1',
    description: 'Grant',
    requiresSupervisor: true
} as any);

export const GENERAL_RESEARCH_PLAN: FundingModel = new FundingModel({
    id: 'unknown2',
    description: 'General research',
    requiresSupervisor: true
} as any);

export const STUDENT_PROJECT: FundingModel = new FundingModel({
    id: 'unknown3',
    description: 'Student project',
    requiresSupervisor: true
} as any);

@Injectable()
export class FundingModelService extends ModelService<FundingModel, FundingModelPatch, FundingModelCreate> {
   
    readonly builtinModels: readonly FundingModel[] = [
        GRANT,
        GENERAL_RESEARCH_PLAN,
        STUDENT_PROJECT
    ] as const;

    override readonly resourcePath: string = '/lab/experimental-plan/funding-models';
    override readonly modelFromJson = fundingModelFromJson;
    override readonly patchToJson = fundingModelPatchToJson;
    override readonly createToJson = fundingModelCreateToJson;

    fetchByDescription(description: string) {
        return this.fetch(description);
    }

}

@Injectable()
export class FundingModelContext extends Context<FundingModel, FundingModelPatch, FundingModelCreate> {
    override readonly models = inject(FundingModelService);

    override _doCreate(request: FundingModelCreate): Observable<FundingModel> {
        return this.models.create(request);
    }
    override _doCommit(identifier: string, patch: FundingModelPatch): Observable<FundingModel> {
        return this.models.update(identifier, patch);
    }
}