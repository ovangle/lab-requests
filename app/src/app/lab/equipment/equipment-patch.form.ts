import { CommonModule } from "@angular/common";
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from "@angular/forms";

import { Equipment, EquipmentPatch, EquipmentPatchErrors, EquipmentModelService, equipmentPatchFromEquipment, EquipmentContext } from './equipment';
import { LabType } from "../type/lab-type";
import { BehaviorSubject, Observable, Subscription, firstValueFrom, map, share } from "rxjs";
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
    context = inject(EquipmentContext);

    readonly form: EquipmentForm = new FormGroup({
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

    readonly patchValue$: Observable<EquipmentPatch | null> = this.form.statusChanges.pipe(
        map(() => equipmentPatchFromForm(this.form)),
        share()
    );
    readonly patchErrors$: Observable<EquipmentPatchErrors | null> = this.form.statusChanges.pipe(
        map(() => equipmentPatchErrorsFromForm(this.form)),
        share()
    );

    pushTrainingDescriptionForm() {
        const formArr = this.form.controls.trainingDescriptions;
        formArr.push(new FormControl<string>('', {nonNullable: true}));
    }

    popTrainingDescriptionForm(): AbstractControl<string> {
        const formArr = this.form.controls.trainingDescriptions;
        const control = formArr.controls[formArr.length - 1];
        formArr.removeAt(formArr.length - 1);
        return control;
    }

    _isEquipmentNameUnique(nameControl: AbstractControl<string>): Observable<{'notUnique': string} | null> {
        const name = nameControl.value;
        return this.modelService.query({name: name}).pipe(
            map(names => names.length > 0 ? {'notUnique': 'Name is not unique'} : null)
        );
    }

    async commit(): Promise<Equipment> {
        if (!this.form.valid) {
            throw new Error('Cannot commit. Form invalid');
        }
        const patch = equipmentPatchFromForm(this.form);
        return this.context.commit(patch!);
    }

    async reset() {
        const committed = await firstValueFrom(this.context.committed$);
        this.form.reset();
        if (committed) {
            this.form.patchValue(equipmentPatchFromEquipment(committed));
        }
    }
}

@Component({
    selector: 'form[app-lab-equipment-form]',
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
            <ng-container [ngTemplateOutlet]="formActionControls"></ng-container>
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
export class LabEquipmentFormComponent {
    readonly _formService = inject(EquipmentFormService);

    @ViewChild('formActionControls', {static: true})
    formActionControls: TemplateRef<any>;

    get form() {
        return this._formService.form;
    }

    readonly patchValue$ = this._formService.patchValue$;
    readonly nameErrors$ = this._formService.patchErrors$.pipe(
        map(patchErrors => patchErrors?.name)
    );

    commitForm() {
        this._formService.commit();
    }
    resetForm() {
        this._formService.reset();
    }
}