import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Injectable, Input, TemplateRef, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Observable, Subscription, defer, filter, firstValueFrom, map, shareReplay, tap } from "rxjs";
import { Campus } from "src/app/uni/campus/campus";
import { CampusSearchComponent } from "src/app/uni/campus/campus-search.component";
import { Discipline } from "src/app/uni/discipline/discipline";
import { DisciplineSelectComponent } from "src/app/uni/discipline/discipline-select.component";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanPatch, ExperimentalPlanPatchErrors, patchFromExperimentalPlan } from "./experimental-plan";
import { FundingModelSelectComponent } from "../../uni/research/funding-model/funding-model-select.component";
import { ExperimentalPlanResearcherFormComponent } from "./researcher/researcher-form.component";
import { FundingModel, FundingModelCreate } from "../../uni/research/funding-model/funding-model";
import { WorkUnitForm } from "../work-unit/work-unit-form.service";

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

function experimentalPlanPatchFromForm(form: ExperimentalPlanForm): ExperimentalPlanPatch | null {
    if (!form.valid) {
        return null;
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

    readonly committed$ = this._context.plan$.pipe(
        tap((committed) => {
            console.log('committed', committed);
            this.patchForm.reset();
            if (committed) {
                const patch = patchFromExperimentalPlan(committed);
                this.patchForm.patchValue(patch as any);
            }
        }),
        shareReplay(1)
    );

    readonly isCreate$ = defer(() => this.committed$.pipe(
        map(committed => committed == null)
    ));

    readonly patchForm: ExperimentalPlanForm = new FormGroup({
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
    }, {
        validators: [
            (control) => this._formValidator(control as ExperimentalPlanForm)
        ]
    });

    _formValidator(form: ExperimentalPlanForm): ExperimentalPlanPatchErrors | null {
        let errors: any = null;
        for (const [name, control] of Object.entries(form.controls)) {
            if (control.invalid) {
                console.log(name, 'invalid', control.errors)
            }
            if (control.touched && control.invalid) {
                errors = errors || {};
                errors[name] = control.errors;
            }
        }
        console.log('errors', errors);
        return errors;
    }

    readonly patchErrors$: Observable<ExperimentalPlanPatchErrors | null> = defer(() => this.patchForm.valueChanges.pipe(
        map(() => {
            return experimentalPlanPatchErrorsFromForm(this.patchForm)
        }),
    ));

    readonly patchValue$: Observable<ExperimentalPlanPatch> = defer(() => this.patchForm.valueChanges.pipe(
        filter(() => this.patchForm.valid),
        map(() => experimentalPlanPatchFromForm(this.patchForm)!)
    ));

    async save(): Promise<ExperimentalPlan> {
        if (this.patchForm.invalid) {
            throw new Error('Cannot commit invalid form')
        }
        const isCreate = await firstValueFrom(this.isCreate$);
        console.log('is create: ', isCreate);

        const patch = experimentalPlanPatchFromForm(this.patchForm)!;
        if (isCreate) {
            return this._context.create(patch);
        } else {
            return this._context.commit(patch);
        }
    }

    reset() {
        this._context.reset();
    }
}


@Component({
    selector: 'lab-experimental-plan-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,

        DisciplineSelectComponent,
        FundingModelSelectComponent,
        CampusSearchComponent,
        ExperimentalPlanResearcherFormComponent
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label for="title">Project title</mat-label>

            <input matInput type="text" id="title" formControlName="title" required />

            <ng-container *ngIf="titleErrors$ | async as titleErrors">
                <mat-error *ngIf="titleErrors.required">
                    A value is required
                </mat-error>
            </ng-container>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Experimental Plan Summary</mat-label>
            <textarea matInput id="process-summary" formControlName="processSummary">
            </textarea>
        </mat-form-field>

        <lab-experimental-plan-researcher-form 
            [form]="form">
        </lab-experimental-plan-researcher-form>

        <lab-funding-model-select formControlName="fundingModel">
            <mat-label>Funding source</mat-label>

            <ng-container *ngIf="fundingTypeErrors$ | async as errors">
                <mat-error *ngIf="errors.required">
                    A value is required
                </mat-error>
            </ng-container>
        </lab-funding-model-select>

        <ng-container [ngTemplateOutlet]="controls" [ngTemplateOutletContext]="formControlContext$ | async">
        </ng-container>
    </form>
    `,
    styles: [`
        form {
            padding: 0px 2em;
        }

        mat-card + mat-card {
            margin-top: 1em;
        }

        mat-form-field {
            width: 100%;
        }

        .researcher-details {
            padding-left: 3em;
        }
    `],
    providers: [
        ExperimentalPlanFormService, 
        // WorkUnitFormService,
    ]
})
export class ExperimentalPlanFormComponent {

    readonly currentUser: string = 't.stephenson@cqu.edu.au';

    readonly _formService = inject(ExperimentalPlanFormService);
    readonly form = this._formService.patchForm;
    private _formServiceConnection: Subscription 

    readonly titleErrors$ = this._formService.patchErrors$.pipe(
        map(errors => errors?.title || null)
    );

    readonly fundingTypeErrors$ = this._formService.patchErrors$.pipe(
        map(errors => errors?.fundingType || null)
    );

    @Input()
    controls: TemplateRef<{
        $implicit: ExperimentalPlanForm,
        committable: boolean,
        doCommit: () => Promise<ExperimentalPlan>,
    }>;

    @Input()
    get disabled(): boolean {
        return this.form.disabled;
    }
    set disabled(value: BooleanInput) {
        const isDisabled = coerceBooleanProperty(value);
        if (isDisabled  && !this.form.disabled) {
            this.form.disable();
        } 
        if (!isDisabled && this.form.disabled) {
            this.form.enable();
        }
    }
    
    ngOnInit() {
        this._formServiceConnection = this._formService.committed$.subscribe(
            committed => console.log(`Committed: ${committed}`)
        )
        this._formService.patchErrors$.subscribe(
            patchErrors => console.log('patch errors', patchErrors)
        );
    }
    ngOnDestroy() {
        this._formServiceConnection.unsubscribe();
    }

    /**
     * If there is a work unit form with no associated work unit,
     * then we are currently adding one.
     */
    isAddingWorkUnit(plan: ExperimentalPlan): boolean {
        throw new Error('Not implemented');
    }

    readonly formControlContext$ = this.form.statusChanges.pipe(
        map(() => ({
            $implicit: this.form,
            committable: this.form.valid,
            doCommit: () => this._formService.save(),
            doReset: () => this._formService.reset()
        }))
    );
}
