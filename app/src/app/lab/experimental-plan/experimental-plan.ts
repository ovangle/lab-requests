
import { Injectable, Provider, inject } from "@angular/core";
import { ValidationErrors, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, connectable, filter, map, of, share, shareReplay, switchMap } from "rxjs";
import { __runInitializers } from "tslib";
import { Campus, CampusCode, CampusForm } from "../../uni/campus/campus";
import { Discipline } from "../../uni/discipline/discipline";
import { ExperimentalPlanType } from "./funding-type/experimental-plan-type";
import { WorkUnit, WorkUnitForm, workUnitForm } from "./work-unit/work-unit";
import { ModelService } from "src/app/utils/models/model-service";
import { ActivatedRoute } from "@angular/router";


export interface ExperimentalPlanBase {
    title: string;

    researcher: string;

    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

    fundingType: ExperimentalPlanType;
    supervisor: string | null;

    processSummary: string;
}

export class ExperimentalPlan implements ExperimentalPlanBase {
    id: string;

    researcher: string;
    researcherDiscipline: Discipline | null;
    researcherBaseCampus: Campus;

    title: string;
    fundingType: ExperimentalPlanType;

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

        this.fundingType = plan.fundingType!;
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
    researcherDiscipline: Discipline;

    fundingType: ExperimentalPlanType;
    supervisor: string | null;
    processSummary: string;
}

export type ExperimentalPlanPatchErrors = ValidationErrors & {
    title?: { required: string | null };
    researcher?: {
        email: string | null;
        required: string | null;
    };
    researcherBaseCampus?: { required: string | null; };
    researcherDiscipline?: { required: string | null; };
    fundingType: { required: string | null; };
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
export class ExperimentalPlanContext {
    readonly modelService = inject(ExperimentalPlanModelService)

    readonly activatedRoute = inject(ActivatedRoute);

    readonly plan$: Observable<ExperimentalPlan | null> = this.activatedRoute.paramMap.pipe(
        map(paramMap => paramMap.get('experimentalPlanId')),
        switchMap(experimentalPlanId => experimentalPlanId ? this.modelService.read(experimentalPlanId): of(null)),
        shareReplay(1)
    );
}

export function injectExperimentalPlanFromContext(): Observable<ExperimentalPlan | null> {
    const maybeContext = inject(ExperimentalPlanContext, { optional: true });
    return maybeContext ? maybeContext.plan$ : of(null);
}
