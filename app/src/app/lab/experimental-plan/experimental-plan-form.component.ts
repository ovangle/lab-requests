import { Component, Injectable, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ExperimentalPlan, ExperimentalPlanPatchErrors, ExperimentalPlanModelService, ExperimentalPlanPatch, injectExperimentalPlanFromContext} from "./experimental-plan";
import { Campus } from "src/app/uni/campus/campus";
import { BehaviorSubject, Observable, Subscription, map, share, tap } from "rxjs";
import { Discipline } from "src/app/uni/discipline/discipline";
import { ExperimentalPlanType } from "./funding-type/experimental-plan-type";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { WorkUnit } from "../work-unit/work-unit";
import { Software } from "../work-unit/resources/software/software";
import { InputMaterial } from "../work-unit/resources/material/input/input-material";
import { hazardClassByDivision } from "../work-unit/resources/common/hazardous/hazardous";
import { WorkUnitFormService } from "../work-unit/work-unit-patch-form.component";

const experimentalPlanFixture = new ExperimentalPlan({
    researcher: 'hello@world.com',
    researcherBaseCampus: new Campus({code: 'ROK', name: 'Rockhampton'}),
    workUnits: [
        new WorkUnit({
            campus: new Campus({code: 'ROK', name: 'Rockhampton'}),
            labType: 'ICT',
            technician: 'hello@world.com',
            softwares: [
                new Software({ name: 'MATLAB', description: 'test', minVersion: '3.21' }),
                new Software({ name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304' })
            ],
            inputMaterials: [
                new InputMaterial({
                    name: 'poison',
                    baseUnit: 'L',
                    hazardClasses: [
                        hazardClassByDivision('1.4'),
                        hazardClassByDivision('6')
                    ]
                })
            ]
        })
    ],
});

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

@Injectable()
export class ExperimentalPlanFormService {
    readonly model = inject(ExperimentalPlanModelService);

    readonly committedSubject = new BehaviorSubject<ExperimentalPlan | null>(null);
    readonly committed$ = this.committedSubject.asObservable();

    readonly patchForm: ExperimentalPlanForm = new FormGroup({
        title: new FormControl<string>('', {nonNullable: true, validators: [Validators.required]}),
        researcher: new FormControl<string>('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
        researcherBaseCampus: new FormControl<Campus | null>(null, { validators: [Validators.required]}),
        researcherDiscipline: new FormControl<Discipline | null>(null, { validators: [Validators.required] }),
        fundingType: new FormControl<ExperimentalPlanType | null>(null, { validators: [Validators.required]}),
        supervisor: new FormControl<string | null>(null, { validators: [Validators.email]}),
        processSummary: new FormControl('', { nonNullable: true })
    });

    readonly patchErrors$: Observable<ExperimentalPlanPatchErrors | null> = this.patchForm.statusChanges.pipe(
        map(() => experimentalPlanPatchErrorsFromForm(this.patchForm)),
        share()
    );
    readonly patchValue$: Observable<ExperimentalPlanPatch | null> = this.patchForm.statusChanges.pipe(
        map(() => experimentalPlanPatchFromForm(this.patchForm)),
        share()
    );

    connect(initial: ExperimentalPlan | null): Subscription {
        // Reverts the patchForm to the committed subject's value whenever a new value is submitted
        this.committedSubject.subscribe(() => this.revert());
        this.committedSubject.next(initial);

        const _patchErrorsSubscription = this.patchErrors$.subscribe();
        const _patchValueSubscription = this.patchValue$.subscribe();

        return new Subscription(() => {
            _patchErrorsSubscription.unsubscribe();
            _patchValueSubscription.unsubscribe();
            this.committedSubject.complete();
        });
    }

    commit(): Observable<ExperimentalPlan> {
        const committed = this.committedSubject.value;

        if (this.patchForm.invalid) {
            throw new Error('Cannot commit invalid form')
        }
        const patch = experimentalPlanPatchFromForm(this.patchForm)!;
        let _commit: Observable<ExperimentalPlan>;
        if (committed == null) {
            _commit = this.model.create(patch);
        } else {
            _commit = this.model.update(committed.id, patch);
        }
        return _commit.pipe(
            tap((committed) => this.committedSubject.next(committed))
        );
    }

    revert() {
        if (this.committedSubject.value == null) {
            this.patchForm.reset();
        } else {
            this.patchForm.setValue(this.committedSubject.value);
        }
    }
}


@Component({
    selector: 'app-lab-experimental-plan-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule
    ],
    templateUrl: './experiental-plan-form.component.html',
    styleUrls: [
        './experimental-plan-form.component.css'
    ],
    providers: [
        ExperimentalPlanFormService, 
        WorkUnitFormService,
    ]
})
export class ExperimentalPlanFormComponent {

    readonly currentUser: string = 't.stephenson@cqu.edu.au';

    readonly formService = inject(ExperimentalPlanFormService);
    readonly form = this.formService.patchForm;
    private _formServiceConnection: Subscription 
    
    ngOnInit() {
        this._formServiceConnection = this.formService.connect(experimentalPlanFixture);
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
}
