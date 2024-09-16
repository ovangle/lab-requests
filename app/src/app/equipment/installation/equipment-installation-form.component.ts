
import { ChangeDetectionStrategy, Component, inject, input, effect, computed, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ControlContainer, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Lab, LabService } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { Equipment, EquipmentCreateRequest } from '../equipment';
import { Discipline } from "src/app/uni/discipline/discipline";
import { Campus } from "src/app/uni/campus/campus";
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { EquipmentInstallation } from "./equipment-installation";
import { firstValueFrom } from "rxjs";
import { CreateEquipmentInstallationFormPage } from "../_forms/create-equipment-installation.form";
import { toObservable } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

export type EquipmentInstallationFormGroup = FormGroup<{
    equipment: FormControl<Equipment | null>;
    lab: FormControl<Lab | null>;
    modelName: FormControl<string>;
    numInstalled: FormControl<number>;
}>;

export function equipmentInstallationFormGroupFactory() {
    const fb = inject(FormBuilder);
    const labService = inject(LabService);


    return async (installation?: EquipmentInstallation): Promise<EquipmentInstallationFormGroup> => {
        let lab: Lab | null = null;
        if (installation) {
            lab = await firstValueFrom(labService.fetch(installation.labId));
        }
        return fb.group({
            equipment: fb.control<Equipment | null>(null),
            lab: fb.control<Lab | null>(lab, {
                validators: Validators.required
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
    @if (form) {
        <form [formGroup]="form" (ngSubmit)="_onSubmit()">
            @if (lab(); as lab) {
                <lab-info [lab]="lab" />
            } @else {
                <mat-form-field>
                    <mat-label>Lab</mat-label>
                    <lab-search required formControlName="lab"
                                [discipline]="labDisciplines()"/>

                    @if (labErrors && labErrors['required']) {
                        <mat-error>A value is required</mat-error>
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
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentInstallationFormComponent {
    controlContainer = inject(ControlContainer, { self: true, optional: true });

    _standaloneFormFactory = equipmentInstallationFormGroupFactory();
    _standaloneForm: EquipmentInstallationFormGroup | null = null;
    get form(): EquipmentInstallationFormGroup | null {
        if (this.controlContainer) {
            return this.controlContainer.control as EquipmentInstallationFormGroup;
        } else {
            return this._standaloneForm;
        }
    }

    equipment = input<Equipment>();
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

    constructor() {
        if (!this.controlContainer) {
            this._standaloneFormFactory().then(form => {
                this._standaloneForm = form;
            });
        }
        /*
        effect(() => {
            const lab = this.lab();
            if (lab) {
                this.form.patchValue({ lab });
            }
        });
        */
    }

    _onSubmit() {
        this.submit.emit(this.form!.value);
    }

    _onCancelButtonClick() {
        this.cancel.emit(undefined);
    }
}