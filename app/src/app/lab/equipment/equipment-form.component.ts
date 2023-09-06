import { CommonModule } from "@angular/common";
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";

import { Equipment, EquipmentPatch, EquipmentPatchErrors, EquipmentModelService, equipmentPatchFromEquipment } from './equipment';
import { EquipmentSchema } from "./equipment-schema";
import { LabType } from "../type/lab-type";
import { BehaviorSubject, Observable, Subscription, map, share } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";

export const equipmentFixtures: Equipment[] = [];

export type EquipmentForm = FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    availableInLabTypes: FormControl<LabType[] | 'all'>;
    requiresTraining: FormControl<boolean>;
    trainingDescriptions: FormArray<FormControl<string>>;
}>;

function equipmentPatchFromForm(form: EquipmentForm): EquipmentPatch | null {
    if (!form.valid) {
        return null;
    }
    return form.value as EquipmentPatch;
}

function equipmentPatchErrorsFromForm(form: EquipmentForm): EquipmentPatchErrors | null {
    if (form.valid) {
        return null;
    }
    return form.errors as EquipmentPatchErrors;
}


export class EquipmentFormService {
    modelService = inject(EquipmentModelService);

    committedSubject = new BehaviorSubject<Equipment | null>(null);
    readonly committed$ = this.committedSubject.asObservable();

    readonly patchForm: EquipmentForm = new FormGroup({
        name: new FormControl<string>(
            '', 
            { 
                nonNullable: true, 
                validators: [Validators.required], 
                asyncValidators: [this._isEquipmentNameUnique] 
            }
        ),
        description: new FormControl<string>('', { nonNullable: true }),
        availableInLabTypes: new FormControl<LabType[] | 'all'>('all', {nonNullable: true}),
        requiresTraining: new FormControl<boolean>(false, {nonNullable: true}),
        trainingDescriptions: new FormArray<FormControl<string>>([])
    });

    readonly patchValue$: Observable<EquipmentPatch | null> = this.patchForm.statusChanges.pipe(
        map(() => equipmentPatchFromForm(this.patchForm)),
        share()
    );
    readonly patchErrors$: Observable<EquipmentPatchErrors | null> = this.patchForm.statusChanges.pipe(
        map(() => equipmentPatchErrorsFromForm(this.patchForm)),
        share()
    );

    pushTrainingDescriptionForm() {
        const formArr = this.patchForm.controls.trainingDescriptions;
        formArr.push(new FormControl<string>('', {nonNullable: true}));
    }

    popTrainingDescriptionForm(): AbstractControl<string> {
        const formArr = this.patchForm.controls.trainingDescriptions;
        const control = formArr.controls[formArr.length - 1];
        formArr.removeAt(formArr.length - 1);
        return control;
    }

    connect(equipment: Equipment | null): Subscription {
        this.committedSubject.subscribe((committed) => {
            if (committed == null) {
                this.patchForm.reset();
                return;
                
            }
            const patch = equipmentPatchFromEquipment(committed);
            this.patchForm.setValue(patch);
        })
        this.committedSubject.next(equipment);

        const keepalivePatchValue = this.patchValue$.subscribe();
        const keepalivePatchErrors = this.patchErrors$.subscribe();

        return new Subscription(() => {
            this.committedSubject.complete();

            keepalivePatchValue.unsubscribe();
            keepalivePatchErrors.unsubscribe();
        });
    }


    _isEquipmentNameUnique(nameControl: AbstractControl<string>): Observable<{'notUnique': string} | null> {
        const name = nameControl.value;
        return this.modelService.query({name: name}).pipe(
            map(names => names.length > 0 ? {'notUnique': 'Name is not unique'} : null)
        );
    }
}

@Component({
    selector: 'app-lab-equipment-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="commitForm()">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput 
                id="equipment-name" 
                formControlName="name" />
            <ng-container *ngIf="nameErrors$ | async as nameErrors">
                <mat-error *ngIf="nameErrors.required">
                    REQUIRED
                </mat-error>
                <mat-error *ngIf="nameErrors.notUnique">
                    NOT UNIQUE
                </mat-error>
            </ng-container>
        </mat-form-field> 

        <mat-checkbox formControlName="requiresTraining">
                This equipment requires induction before use
        </mat-checkbox>

        <ng-container *ngIf="form.controls.requiresTraining">
            <!-- TODO: Training required descriptions -->
        </ng-container>

        <div class="form-actions"> 
            <ng-container [ngTemplateOutlet]="formActionControls">
                <button mat-button type="submit" 
                        [disabled]="form.invalid">
                    <mat-icon>save</mat-icon> save
                </button>
            </ng-container>
        </div>
    </form>

    <ng-template #formActionControls>
        <button mat-button type="submit" [disabled]="form.invalid">
            <mat-icon>save</mat-icon>
        </button>
    </ng-template>
    `,
    providers: [
        EquipmentFormService
    ]
})
export class LabEquipmentFormComponent implements OnInit, OnDestroy {
    readonly formService = inject(EquipmentFormService);
    _formServiceConnection: Subscription | undefined = undefined;

    @ViewChild('formActionControls', {static: true})
    formActionControls: TemplateRef<any>;

    get form() {
        return this.formService.patchForm;
    }

    readonly patchValue$ = this.formService.patchValue$;
    readonly nameErrors$ = this.formService.patchErrors$.pipe(
        map(patchErrors => patchErrors?.name)
    );


    ngOnInit() {
        this._formServiceConnection = this.formService.connect(equipmentFixtures[0] || null)
    }

    ngOnDestroy() {
        if (this._formServiceConnection) {
            this._formServiceConnection.unsubscribe();
        }
    }
}