import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject, connectable, firstValueFrom } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

import { ModelService } from "src/app/utils/models/model-service";

export class FundingModel {
    readonly id: string;
    readonly description: string;
    readonly requiresSupervisor: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(instance: Partial<FundingModel>) {
        this.id = instance.id!;
        this.description = instance.description!;
        this.requiresSupervisor = instance.requiresSupervisor!;
        this.createdAt = instance.createdAt!;
        this.updatedAt = instance.updatedAt!;
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
@Injectable()
export class FundingModelService extends ModelService<FundingModel, FundingModelPatch, FundingModelCreate> {
   
    override readonly resourcePath: string = '/uni/research/funding';
    override readonly modelFromJson = fundingModelFromJson;
    override readonly patchToJson = fundingModelPatchToJson;
    override readonly createToJson = fundingModelCreateToJson;

    fetchByDescription(description: string) {
        return this.fetch(description);
    }

    search(input: string): Observable<FundingModel[]> {
        return this.query({description_like: input});
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