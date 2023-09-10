import { Injectable, inject } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

import { ModelService } from "src/app/utils/models/model-service";

export class FundingModel {
    readonly id: string;
    readonly description: string;
    readonly requiresSupervisor: boolean;

    constructor(instance: FundingModel) {
        this.id = instance.id;
        this.description = instance.description;
        this.requiresSupervisor = instance.requiresSupervisor;
    }
}

export class FundingModelPatch {
    readonly description: string;
    readonly requiresSupervisor: boolean;
}

export interface FundingModelCreate extends FundingModelPatch {
}

export const GRANT: FundingModel = new FundingModel({
    id: 'unknown1',
    description: 'Grant',
    requiresSupervisor: true
});

export const GENERAL_RESEARCH_PLAN: FundingModel = new FundingModel({
    id: 'unknown2',
    description: 'General research',
    requiresSupervisor: true
});

export const STUDENT_PROJECT: FundingModel = new FundingModel({
    id: 'unknown3',
    description: 'Student project',
    requiresSupervisor: true
});

@Injectable()
export class FundingModelService extends ModelService<FundingModel, FundingModelPatch> {
   
    readonly builtinModels: readonly FundingModel[] = [
        GRANT,
        GENERAL_RESEARCH_PLAN,
        STUDENT_PROJECT
    ] as const;

    override readonly resourcePath: string = '/lab/experimental-plan/funding-models';
    override modelFromJson(json: object): FundingModel {
        return new FundingModel(json as any);
    }

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