
import { Injectable, Provider, inject } from "@angular/core";
import { ValidationErrors, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, connectable, filter, map } from "rxjs";
import { __runInitializers } from "tslib";
import { Campus, CampusCode, CampusForm } from "../../uni/campus/campus";
import { Discipline } from "../../uni/discipline/discipline";
import { ExperimentalPlanType } from "./funding-type/experimental-plan-type";
import { WorkUnit, WorkUnitForm, workUnitForm } from "./work-unit/work-unit";
import { ModelService } from "src/app/utils/models/model-service";


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


export type ExperimentalPlanControls = {
    title: FormControl<string>;

    researcher: FormControl<string>;
    researcherBaseCampus: FormControl<Campus | null>;
    researcherDiscipline: FormControl<Discipline | null>;
    fundingType: FormControl<ExperimentalPlanType | null>;

    supervisor: FormControl<string | null>;
    processSummary: FormControl<string>;
}

export type ExperimentalPlanForm = FormGroup<ExperimentalPlanControls>;

export function experimentalPlanPatchFromForm(form: ExperimentalPlanForm): ExperimentalPlanPatch {
    if (!form.valid) {
        throw new Error('Form contains errors');
    }
    // If the form is valid, then it is assignable to the patch.
    return form.value as any;
}

export type ExperimentalPlanFormValidationErrors = ValidationErrors & {
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

    experimentalPlanForm(plan?: ExperimentalPlan): ExperimentalPlanForm {
        return new FormGroup({
            title: new FormControl<string>(
                plan?.title || '', 
                {nonNullable: true, validators: [Validators.required]}
            ),
            researcher: new FormControl<string>(
                plan?.researcher || '',
                {nonNullable: true, validators: [Validators.required, Validators.email]}
            ),
            researcherBaseCampus: new FormControl<Campus | null>(
                plan?.researcherBaseCampus || null,
                { validators: [Validators.required]}
            ),
            researcherDiscipline: new FormControl<Discipline | null>(
                plan?.researcherDiscipline || null,
                { validators: [Validators.required] }
            ),
            fundingType: new FormControl(
                plan?.fundingType || null,
                { validators: [Validators.required]}
            ),
            supervisor: new FormControl(
                plan?.supervisor || null,
                { validators: [Validators.email]}
            ),
            processSummary: new FormControl(
                plan?.processSummary || '',
                { nonNullable: true }
            )
        });
    }

    updatePlan(plan: ExperimentalPlan, patch: ExperimentalPlanPatch): Observable<ExperimentalPlan> {
        return this.update(plan.id, patch)
    }


}

@Injectable()
export class ExperimentalPlanContextService {
    readonly modelService = inject(ExperimentalPlanModelService)

    current = new BehaviorSubject<ExperimentalPlan | null>(null);

    async patchExperimentalPlan(params: Partial<ExperimentalPlan>): Promise<ExperimentalPlan> {
        const currentCommitted = this.current.value;
        if (currentCommitted == null) {
            this.modelService.createExperimentalPlan(params);
        }


        this.current.next(new ExperimentalPlan({
            ...this.plan,
            ...params,
        }));
    }

    readonly plan$ = this.current.pipe(
        filter((p): p is ExperimentalPlan => p != null)
    );
    get plan(): ExperimentalPlan | null {
        return this.current.value;
    }

    readonly form = experimentalPlanForm({});

    init(plan: ExperimentalPlan): Subscription {
        const syncFormSubscription = this.plan$.subscribe(plan => {
            const workUnits = plan.workUnits;
            const workUnitControls = this.form.controls['workUnits'];
            for (let i=workUnitControls.length; i<workUnits.length; i++) {
                workUnitControls.push(workUnitForm(workUnits[i]));
            }

            this.form.setValue({...plan})
        });
        this.current.next(plan);
        return new Subscription(() => {
            this.current.complete()
        });
    }
}
