import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors } from "@angular/forms";
import { tap, shareReplay, defer, map, Observable, filter, firstValueFrom } from "rxjs";
import { Campus } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { FundingModel, FundingModelCreate } from "src/app/uni/research/funding-model/funding-model";
import { WorkUnitForm } from "../work-unit/work-unit-form.service";
import { ExperimentalPlanContext, patchFromExperimentalPlan, ExperimentalPlanPatchErrors, ExperimentalPlanPatch, ExperimentalPlan } from "./experimental-plan";

export type ExperimentalPlanControls = {
    title: FormControl<string>;

    researcher: FormControl<string>;
    researcherBaseCampus: FormControl<Campus | string | null>;
    researcherDiscipline: FormControl<Discipline | null>;
    fundingModel: FormControl<FundingModel | FundingModelCreate | null>;

    supervisor: FormControl<string | null>;
    processSummary: FormControl<string>;

    addWorkUnits: FormArray<WorkUnitForm>;
}

export type ExperimentalPlanForm = FormGroup<ExperimentalPlanControls>;

export function experimentalPlanPatchFromForm(form: ExperimentalPlanForm): ExperimentalPlanPatch {
    if (!form.valid) {
        throw new Error('Invalid form has no patch');
    }
    // If the form is valid, then it is assignable to the patch.
    return form.value as ExperimentalPlanPatch;
}

function experimentalPlanPatchErrorsFromForm(form: ExperimentalPlanForm): ExperimentalPlanPatchErrors | null {
    if (form.invalid) {
        return form.errors as ExperimentalPlanPatchErrors;
    }
    return null;
}

function isCampusOrCampusCode(control: AbstractControl<Campus | string | null>): ValidationErrors | null {
    if (control.value instanceof Campus || control.value == null){
        return null;
    } else if (typeof control.value === 'string') {
        if (/[A-Z]{3}/.test(control.value)) {
            return null;
        }
        return {'invalidCode': `Invalid campus code ${control.value}`};
    } else {
        throw new Error('Invalid control value');
    }
}
@Injectable()
export class ExperimentalPlanFormService {
    readonly _context = inject(ExperimentalPlanContext);

    readonly committed$ = this._context.committed$;
    readonly isCreate$ = defer(() => this.committed$.pipe(
        map(committed => committed == null)
    ));

    readonly form: ExperimentalPlanForm = new FormGroup({
        title: new FormControl<string>('', {nonNullable: true, validators: [Validators.required]}),
        researcher: new FormControl<string>('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
        researcherBaseCampus: new FormControl<Campus | string | null>(
            null, 
            { validators: [Validators.required, isCampusOrCampusCode]}
        ),
        researcherDiscipline: new FormControl<Discipline | null>(null, { validators: [Validators.required] }),
        fundingModel: new FormControl<FundingModel | FundingModelCreate | null>(null, { validators: [Validators.required]}),
        supervisor: new FormControl<string | null>(null, { validators: [Validators.email]}),
        processSummary: new FormControl('', { nonNullable: true }),
        addWorkUnits: new FormArray<WorkUnitForm>([])
    });

    readonly patchValue$: Observable<ExperimentalPlanPatch> = defer(() => this.form.valueChanges.pipe(
        filter(() => this.form.valid),
        map(() => experimentalPlanPatchFromForm(this.form)!)
    ));

    async save(): Promise<ExperimentalPlan> {
        if (this.form.invalid) {
            throw new Error('Cannot commit invalid form')
        }
        this.form.valueChanges.subscribe(change => {
            debugger;
        });
        const isCreate = await firstValueFrom(this.isCreate$);

        const patch = experimentalPlanPatchFromForm(this.form)!;
        if (isCreate) {
            return this._context.create(patch);
        } else {
            return this._context.commit(patch);
        }
    }

    reset() {
        // TODO: Reset committed value?
        this.form.reset();
    }
}
