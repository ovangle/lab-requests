import { HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional, SkipSelf, inject } from "@angular/core";
import { Observable, ReplaySubject, connectable, firstValueFrom, map } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

import { Lookup, ModelService } from "src/app/utils/models/model-service";

export class FundingModel {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly requiresSupervisor: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(instance: Partial<FundingModel>) {
        this.id = instance.id!;
        this.name = instance.name!;
        this.description = instance.description!;
        this.requiresSupervisor = instance.requiresSupervisor!;
        this.createdAt = instance.createdAt!;
        this.updatedAt = instance.updatedAt!;
    }
}

export function fundingModelFromJson(json: {[k: string]: any}): FundingModel {
    return new FundingModel({
        id: json['id'],
        name: json['name'],
        description: json['description'],
        requiresSupervisor: json['requiresSupervisor'],
        createdAt: json['createdAt'],
        updatedAt: json['updatedAt']
    });
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

export interface FundingModelLookup extends Lookup<FundingModel> {
    // Searches for funding models with this exact name
    name_eq: string;
    // Searches for the instance of this text anywhere in the funding model
    text: string;
}
function fundingModelLookupToHttpParams(lookup: Partial<FundingModelLookup>) {
    return new HttpParams();
}

@Injectable()
export class FundingModelService extends ModelService<FundingModel, FundingModelPatch, FundingModelCreate> {
   
    override readonly resourcePath: string = '/uni/research/funding';
    override readonly modelFromJson = fundingModelFromJson;
    override readonly patchToJson = fundingModelPatchToJson;
    override readonly createToJson = fundingModelCreateToJson;
    override readonly lookupToHttpParams = fundingModelLookupToHttpParams;

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

@Injectable()
export class FundingModelContext extends Context<FundingModel, FundingModelPatch, FundingModelCreate> {
    override readonly models = inject(FundingModelService);

    constructor(
        @Optional() @SkipSelf() @Inject(FundingModelContext)
        parentContext: FundingModelContext | undefined
    ) {
        super(parentContext);
    }

    override _doCreate(request: FundingModelCreate): Observable<FundingModel> {
        return this.models.create(request);
    }
    override _doCommit(identifier: string, patch: FundingModelPatch): Observable<FundingModel> {
        return this.models.update(identifier, patch);
    }
}