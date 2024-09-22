
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
import { modelId } from "src/app/common/model/model";

export type EquipmentInstallationFormGroup = FormGroup<{
    equipment: FormControl<Equipment | null>;
    lab: FormControl<Lab | null>;
    modelName: FormControl<string>;
    numInstalled: FormControl<number>;
}>;

export function equipmentInstallationFormGroupFactory() {
    const fb = inject(FormBuilder);
    const equipmentContext = inject(EquipmentContext, { optional: true });

    const validateLabUnique = async (control: AbstractControl): Promise<ValidationErrors | null> => {
        const lab = control.value as Lab | null;
        if (lab == null) {
            return null;
        }
        const labId = modelId(lab);

        console.log('labId', labId);
        const existingInstallations = await firstValueFrom(
            equipmentContext ? equipmentContext.committed$.pipe(
                map(equipment => equipment.installations.items),
            ) : of([])
        );
        console.log('existing installs', existingInstallations);

        for (const install of existingInstallations) {
            if (install.labId == labId) {
                return { notUnique: true };
            }
        }
        return null;
    };


    return (): EquipmentInstallationFormGroup => {
        return fb.group({
            equipment: fb.control<Equipment | null>(null),
            lab: fb.control<Lab | null>(null, {
                validators: [
                    Validators.required,
                ],
                asyncValidators: [
                    validateLabUnique
                ]
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
        LabSearchComponent
    ],
    template: `
        <form [formGroup]="form" (ngSubmit)="_onSubmit()">
            @if (lab(); as lab) {
                <lab-info [lab]="lab" />
            } @else {
                <mat-form-field>
                    <mat-label>Lab</mat-label>
                    <lab-search required formControlName="lab"
                                [discipline]="labDisciplines()"
                                [disabledLabs]="equipment().installedLabIds"/>


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

            @if (_standaloneForm) {
                <div class="form-actions">
                    <button mat-raised-button type="submit" [disabled]="!form.valid">
                        <mat-icon>save</mat-icon>SAVE
                    </button>

                    <button mat-button (click)="_onCancelButtonClick()">
                        <mat-icon>cancel</mat-icon> CLOSE
                    </button>
                </div>
            }
        </form>
    `,
    styles: `
    .form-actions {
        float: right
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentInstallationFormComponent {
    controlContainer = inject(ControlContainer, { self: true, optional: true });
    _cd = inject(ChangeDetectorRef);

    _standaloneFormFactory = equipmentInstallationFormGroupFactory();
    _standaloneForm: EquipmentInstallationFormGroup | undefined;

    get form(): EquipmentInstallationFormGroup {
        if (this.controlContainer) {
            return this.controlContainer.control as EquipmentInstallationFormGroup;
        } else {
            if (this._standaloneForm == null) {
                this._standaloneForm = this._standaloneFormFactory();
            }
            return this._standaloneForm!;
        }
    }

    equipment = input.required<Equipment>();
    installation = input<EquipmentInstallation | null>();

    labDisciplines = computed(() => {
        const equipment = this.equipment();
        return equipment?.disciplines;
    })
    lab = input<Lab | null>();

    @Output()
    submit = new EventEmitter<EquipmentInstallationFormGroup['value']>();

    @Output()
    cancel = new EventEmitter<undefined>();


    get labErrors() {
        return this.form!.controls.lab.errors;
    }

    get numInstalledErrors() {
        return this.form.controls.numInstalled.errors;
    }

    constructor() {
        effect(() => {
            const lab = this.lab();
            if (lab) {
                this.form.patchValue({ lab });
            }
        });

        this.form.statusChanges.subscribe(() => {
            for (const [name, control] of Object.entries(this.form.controls)) {
                console.log(name, control.errors);
            }
            console.log('form status', this.form.status);
            console.log('form errors', this.form.errors);
            console.log('isValid', this.form.valid)
        })
    }

    _onSubmit() {
        this.submit.emit(this.form!.value);
    }

    _onCancelButtonClick() {
        this.cancel.emit(undefined);
    }
}