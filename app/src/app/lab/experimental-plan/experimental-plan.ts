
import { Inject, Injectable, Optional, Provider, SkipSelf, inject } from "@angular/core";
import { ValidationErrors, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, connectable, defer, filter, firstValueFrom, map, of, share, shareReplay, switchMap } from "rxjs";
import { __runInitializers } from "tslib";
import { Campus, CampusCode, campusFromJson, isCampusCode } from "../../uni/campus/campus";
import { Discipline } from "../../uni/discipline/discipline";

import { WorkUnit, WorkUnitCreate, workUnitFromJson } from "../work-unit/work-unit";
import { Lookup, ModelService } from "src/app/utils/models/model-service";
import { ActivatedRoute } from "@angular/router";
import { Context } from "src/app/utils/models/model-context";
import { FundingModel, FundingModelCreate, fundingModelFromJson } from "../../uni/research/funding-model/funding-model";
import { parseISO } from "date-fns";
import { HttpParams } from "@angular/common/http";


export interface ExperimentalPlanBase {
    title: string;

    researcher: string;

    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus | CampusCode;

    supervisor: string | null;

    processSummary: string;
}

export class ExperimentalPlan implements ExperimentalPlanBase {
    id: string;

    researcher: string;
    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

    title: string;
    fundingModel: FundingModel;

    supervisor: string | null;
    processSummary: string;

    workUnits: WorkUnit[];

    createdAt: Date;
    updatedAt: Date;

    constructor(plan: Partial<ExperimentalPlan>) {
        this.id = plan.id!;
        this.title = plan.title!;
        this.researcher = plan.researcher!;
        this.researcherDiscipline = plan.researcherDiscipline!;
        this.researcherBaseCampus = plan.researcherBaseCampus!;

        this.fundingModel = plan.fundingModel!;
        this.supervisor = plan.supervisor || null;

        this.processSummary = plan?.processSummary || '';

        this.workUnits = (plan.workUnits || []).map(workUnit => new WorkUnit(workUnit));

        this.createdAt = plan.createdAt!;
        this.updatedAt = plan.updatedAt!;
    }
}
export function experimentalPlanFromJson(json: {[k: string]: any}) {
    return new ExperimentalPlan({
        id: json['id'],
        title: json['title'],
        researcher: json['researcher'],
        researcherDiscipline: json['researcherDiscipline'],
        researcherBaseCampus: campusFromJson(json['researcherBaseCampus']),

        fundingModel: fundingModelFromJson(json['fundingModel']),
        supervisor: json['supervisor'],

        processSummary: json['processSummary'],

        workUnits: Array.from<object>(json['workUnits']).map(workUnit => workUnitFromJson(workUnit)),

        createdAt: parseISO(json['createdAt']),
        updatedAt: parseISO(json['updatedAt'])
    })
}
export interface ExperimentalPlanPatch {
    title: string;
    researcher: string;
    researcherBaseCampus: Campus | CampusCode;
    researcherDiscipline: Discipline | null;

    fundingModel: FundingModel | FundingModelCreate;
    supervisor: string | null;
    processSummary: string;

    addWorkUnits?: WorkUnitCreate[];
}

export function patchFromExperimentalPlan(plan: ExperimentalPlan): ExperimentalPlanPatch {
    return { ...plan };
}

export function experimentalPlanPatchToJson(patch: ExperimentalPlanPatch): {[k: string]: any} {
    let researcherBaseCampus: string;
    if (patch.researcherBaseCampus instanceof Campus) {
        researcherBaseCampus = patch.researcherBaseCampus.id;
    } else if (isCampusCode(patch.researcherBaseCampus)) {
        researcherBaseCampus = patch.researcherBaseCampus;
    } else {
        throw new Error('Expected a campus or code');
    }

    return {
        title: patch.title,
        researcher: patch.researcher,
        researcherBaseCampus: researcherBaseCampus,
        researcherDiscipline: patch.researcherDiscipline,
        fundingModel: (patch.fundingModel instanceof FundingModel) ? patch.fundingModel.id : patch.fundingModel,
        supervisor: patch.supervisor,
        processSummary: patch.processSummary,
        addWorkUnits: patch.addWorkUnits || []
    }
}

export type ExperimentalPlanPatchErrors = ValidationErrors & {
    title?: { required: string | null };
    researcher?: {
        email: string | null;
        required: string | null;
    };
    researcherBaseCampus?: { required: string | null; };
    researcherDiscipline?: { required: string | null; };
    fundingType?: { required: string | null; };
    supervisor?: {
        email: string | null;
    }
}

export interface ExperimentalPlanLookup extends Lookup<ExperimentalPlan> {
}
export function experimentalPlanLookupToHttpParams(lookup: Partial<ExperimentalPlanLookup>): HttpParams {
    return new HttpParams();
}


@Injectable()
export class ExperimentalPlanModelService extends ModelService<ExperimentalPlan, ExperimentalPlanPatch> {
    override readonly resourcePath = '/lab/experimental-plans'
    override readonly modelFromJson = experimentalPlanFromJson;
    override readonly patchToJson = experimentalPlanPatchToJson;
    override readonly lookupToHttpParams = experimentalPlanLookupToHttpParams;

    updatePlan(plan: ExperimentalPlan, patch: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.update(plan.id, patch)
    }
}

/**
 * Provides access to the contextual experimental plan
 * via the context.
 */
@Injectable()
export class ExperimentalPlanContext extends Context<ExperimentalPlan, ExperimentalPlanPatch> {
    override readonly models = inject(ExperimentalPlanModelService);
    readonly plan$ = defer(() => this.committed$);

    constructor(
        @Optional() 
        @SkipSelf() 
        @Inject(ExperimentalPlanContext)
        parentContext: ExperimentalPlanContext | undefined
    ) {
        super(parentContext)
    }

    override _doCreate(create: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.models.create(create);
    }

    override _doCommit(id: string, patch: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.models.update(id, patch);
    }

    async save(patch: ExperimentalPlanPatch) {
        const plan = await firstValueFrom(this.committed$);
        if (plan == null) {
            return await this.create(patch);
        } else {
            return await this.commit(patch);
        }
    }
}
