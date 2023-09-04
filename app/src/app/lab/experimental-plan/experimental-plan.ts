import { Injectable } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, connectable, filter, map } from "rxjs";
import { __runInitializers } from "tslib";
import { Campus, CampusCode, CampusForm, campusForm } from "../../uni/campus/campus";
import { Discipline } from "../../uni/discipline/discipline";
import { ExperimentalPlanType } from "./type/experimental-plan-type";
import { WorkUnit, WorkUnitForm, workUnitForm } from "./work-unit/work-unit";

export class ExperimentalPlan {
    title: string;
    planType: ExperimentalPlanType | null;
    processSummary: string;

    workUnits: WorkUnit[];

    campus: Campus;
    supervisor: string;
    discipline: Discipline | null;

    startDate: Date | null;
    endDate: Date | null;

    submittedBy: string;
    submittedAt: Date | null;

    constructor(plan: { submittedBy: string} & Partial<ExperimentalPlan>) {
        this.title = plan?.title || '';
        this.planType = plan.planType || null;

        this.processSummary = plan?.processSummary || '';

        this.workUnits = plan.workUnits || [];
        this.campus = new Campus(plan.campus || {});
        this.supervisor = plan.supervisor || '';
        this.discipline = plan.discipline || null;

        this.startDate = plan.startDate || null;
        this.endDate = plan.endDate || null;

        this.submittedBy = plan.submittedBy;
        this.submittedAt = plan.submittedAt || null;
    }
}

export type ExperimentalPlanForm = FormGroup<{
    title: FormControl<string>;
    supervisor: FormControl<string>;
    discipline: FormControl<Discipline | null>;
    campus: CampusForm;

    workUnits: FormArray<WorkUnitForm>;
    planType: FormControl<ExperimentalPlanType | null>;

    processSummary: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

    submittedBy: FormControl<string>;
    submittedAt: FormControl<Date | null>;
}>;

export function experimentalPlanForm(plan: Partial<ExperimentalPlan>): ExperimentalPlanForm {
    return new FormGroup({
        title: new FormControl(plan.title || '', { nonNullable: true , validators: [Validators.required]}),
        supervisor: new FormControl(plan.supervisor || '', {nonNullable: true, validators: [Validators.email]}),
        discipline: new FormControl(plan.discipline || null),
        campus: campusForm(plan.campus || {}),
        workUnits: new FormArray(
            (plan.workUnits || []).map((e) => workUnitForm(e))
        ),
        planType: new FormControl<ExperimentalPlanType | null>(plan.planType || null, [Validators.required]),
        processSummary: new FormControl(plan?.processSummary || '', { nonNullable: true }),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        submittedBy: new FormControl<string>('', {nonNullable: true}),
        submittedAt: new FormControl<Date | null>(null)
    });
}

@Injectable()
export class ExperimentalPlanService {
    current = new BehaviorSubject<ExperimentalPlan | null>(null);

    patchExperimentalPlan(params: Partial<ExperimentalPlan>): void {
        const submittedBy = this.plan!.submittedBy;
        if (params.submittedBy != undefined && submittedBy != params.submittedBy) {
            throw new Error('Cannot patch `submittedBy`');
        }
        this.current.next(new ExperimentalPlan({
            ...this.plan,
            ...params,
            submittedBy
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