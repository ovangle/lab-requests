
import { Injectable, Provider, inject } from "@angular/core";
import { ValidationErrors, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, connectable, filter, firstValueFrom, map, of, share, shareReplay, switchMap } from "rxjs";
import { __runInitializers } from "tslib";
import { Campus, CampusCode } from "../../uni/campus/campus";
import { Discipline } from "../../uni/discipline/discipline";

import { WorkUnit } from "../work-unit/work-unit";
import { ModelService } from "src/app/utils/models/model-service";
import { ActivatedRoute } from "@angular/router";
import { Context } from "src/app/utils/models/model-context";
import { FundingModel, FundingModelCreate } from "./funding-model/funding-model";


export interface ExperimentalPlanBase {
    title: string;

    researcher: string;

    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

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
        this.updatedAt = plan.updatedAt!
    }
}

export interface ExperimentalPlanPatch {
    title: string;
    researcher: string;
    researcherBaseCampus: Campus;
    researcherDiscipline: Discipline | null;

    fundingModel: FundingModel | FundingModelCreate | null;
    supervisor: string | null;
    processSummary: string;
}

export function patchFromExperimentalPlan(plan: ExperimentalPlan): ExperimentalPlanPatch {
    return { ...plan };
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


@Injectable()
export class ExperimentalPlanModelService extends ModelService<ExperimentalPlan, ExperimentalPlanPatch> {
    override readonly resourcePath = '/lab/experimental-plans'
    override modelFromJson(json: object) {
        return new ExperimentalPlan(json as any);
    }

    override patchToJson(patch: ExperimentalPlanPatch) {
        return {...patch};
    }


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
    readonly plan$ = this.committed$;

    override _doCreate(create: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.models.create(create);
    }

    override _doCommit(id: string, patch: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.models.update(id, patch);
    }
}
