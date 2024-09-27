
import { ChangeDetectionStrategy, Component, inject, input, effect, computed, Output, EventEmitter, ChangeDetectorRef, Injectable } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AbstractControl, ControlContainer, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Lab } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { Equipment, EquipmentCreateRequest } from '../equipment';
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { EquipmentInstallation } from "./equipment-installation";
import { firstValueFrom, map, Observable, of } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { EquipmentContext } from "../equipment-context";
import { modelId, ModelRef } from "src/app/common/model/model";
import { AbstractModelForm, ModelFormActionsComponent } from "src/app/common/model/forms/abstract-model-form.component";
import { EquipmentFormGroup } from "../equipment-form.component";
import { Discipline } from "src/app/uni/discipline/discipline";
import { toObservable } from "@angular/core/rxjs-interop";

export type EquipmentInstallationFormGroup = FormGroup<{
    equipment: FormControl<Equipment | null>;
    lab: FormControl<Lab | null>;
    modelName: FormControl<string>;
    numInstalled: FormControl<number>;
}>;

export function equipmentInstallationFormGroupFactory() {
    const fb = inject(FormBuilder);
    return (): EquipmentInstallationFormGroup => {
        return fb.group({
            equipment: fb.control<Equipment | null>(null),
            lab: fb.control<Lab | null>(null, {
                validators: [
                    Validators.required,
                ],
            }),
            modelName: fb.control<string>('', { nonNullable: true }),
            numInstalled: fb.control<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] })
        });
    }
}

/**
 * Declares an existing equipment installatation
 */
@Component({
    selector: 'equipment-installation-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        LabInfoComponent,
        LabSearchComponent,
        ModelFormActionsComponent
    ],
    template: `
    <form [formGroup]="form">
        @if (lab(); as lab) {
            Installed in: <lab-info [lab]="lab" />
        } @else {
            <mat-form-field>
                <mat-label>Lab</mat-label>
                <lab-search required formControlName="lab"
                            [discipline]="labDisciplines()"
                            [disabledLabs]="equipmentInstalledLabs()"/>


                <button mat-icon-button matSuffix (click)="form.patchValue({lab: null})">
                    <mat-icon>cancel</mat-icon>
                </button>

                @if (labErrors && labErrors['required']) {
                    <mat-error>A value is required</mat-error>
                }

                @if (labErrors && labErrors['notUnique']) {
                    <mat-error>An installation already exists for this lab</mat-error>
                }
            </mat-form-field>
        }

        <mat-form-field>
            <mat-label>Model name</mat-label>

            <input matInput formControlName="modelName" />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Number installed</mat-label>
            <input matInput type="number" formControlName="numInstalled" />

            @if (numInstalledErrors && numInstalledErrors['required']) {
                <mat-error>A value is required</mat-error>
            }

            @if (numInstalledErrors && numInstalledErrors['min']) {
                <mat-error>Installation must contain at least one instance of the equiment</mat-error>
            }
        </mat-form-field>

        <model-form-actions />
    </form>
    `,
    styles: `
    .form-actions {
        float: right
    }
    `,
    providers: [
        { provide: AbstractModelForm, useExisting: EquipmentInstallationFormComponent }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentInstallationFormComponent extends AbstractModelForm<EquipmentInstallationFormGroup> {
    _cd = inject(ChangeDetectorRef);

    override readonly _createStandaloneForm = equipmentInstallationFormGroupFactory();

    equipment = input.required<Equipment | EquipmentFormGroup['value']>();
    installation = input<EquipmentInstallation | null>();

    lab = input<ModelRef<Lab> | null>();

    labDisciplines = computed(() => {
        const equipment = this.equipment();
        if (equipment instanceof Equipment) {
            return equipment.disciplines;
        } else {
            if (equipment.isAnyDiscipline) {
                return 'any';
            }
            return equipment.disciplines as Discipline[];
        }
    })
    equipmentInstalledLabs = computed(() => {
        const equipment = this.equipment();
        if (equipment instanceof Equipment) {
            return equipment.installations.items.map(install => install.labId);
        } else {
            const installations = equipment.installations;
            return installations!.map(install => install.lab?.id).filter(l => l != null) as ModelRef<Lab>[];
        }
    })

    get labErrors() {
        return this.form!.controls.lab.errors;
    }

    get numInstalledErrors() {
        return this.form.controls.numInstalled.errors;
    }

    _onSubmit() {
        this.submit.emit(this.form!.value);
    }

    _onCancelButtonClick() {
        this.cancel.emit(undefined);
    }
}