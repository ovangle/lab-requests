import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, EventEmitter, inject, input, Output } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { EquipmentLease, CreateEquipmentLease } from "./equipment-lease";
import { EquipmentInstallation, EquipmentInstallationService } from "../installation/equipment-installation";
import { combineLatest, firstValueFrom, map, Observable, of, startWith, switchMap, withLatestFrom } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { EquipmentInstallationInfoComponent } from "../installation/equipment-installation-info.component";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { LabAllocationConsumer } from "src/app/lab/common/allocatable/lab-allocation-consumer";
import { LabService } from "src/app/lab/lab";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { EquipmentSearchComponent } from "../equipment-search.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { Equipment, EquipmentService } from "../equipment";
import { NotFoundValue } from "src/app/common/model/search/search-control";
import { MatIconModule } from "@angular/material/icon";
import { Discipline } from "src/app/uni/discipline/discipline";
import { EquipmentTrainingAcknowlegementComponent } from "../training/training-acknowlegment-input.component";

function _equipmentLeaseFormGroup(fb: FormBuilder) {
    return fb.group({
        startDate: fb.control<Date | null>(null),
        endDate: fb.control<Date | null>(null)
    })
}

export function equipmentLeaseFormGroupFactory() {
    const fb = inject(FormBuilder);

    return () => _equipmentLeaseFormGroup(fb);
}

export type EquipmentLeaseFormGroup = ReturnType<typeof _equipmentLeaseFormGroup>;

@Component({
    selector: 'equipment-lease-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        EquipmentSearchComponent,
        EquipmentInstallationInfoComponent,
        EquipmentTrainingAcknowlegementComponent
    ],
    template: `

   <form [formGroup]="form" (ngSubmit)="_onSubmit()">
        <mat-form-field>
            <mat-label>Equipment</mat-label>
            <equipment-search allowNotFound
                              formControlName="existingEquipment"
                              [onlyDiscipline]="disciplineHint() || null" />
        </mat-form-field>

        @if (equipmentNotFound) {
            <mat-checkbox>
                A {{equipmentName}} should be purchased for
            </mat-checkbox>

        }
        <mat-form-field>
            <mat-label>Reason</mat-label>
            <textarea matInput cdkTextareaAutosize formControlName="reason"
                      placeholder="describe the reason that this equipment is needed">
            </textarea>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Num required</mat-label>
            <input matInput type="number" formControlName="numRequired" />
            <mat-hint>Currently available in lab: {{currentInstallCount$ | async}}</mat-hint>

            @if (numRequiredErrors && numRequiredErrors['required']) {
                <mat-error>A value is required</mat-error>
            }

            @if (numRequiredErrors && numRequiredErrors['min']) {
                <mat-error>At least one instance of {{equipmentName}} must be required</mat-error>
            }
        </mat-form-field>

        @if (equipmentTrainingDescriptions) {
            <equipment-training-acknowledgement
                [trainingDescriptions]="equipmentTrainingDescriptions"
                formControlName="equipmentTrainingAcknowledgements" />
        }

        <div class="form-controls">
            <button mat-raised-button type="submit" [disabled]="!form.valid">
                <mat-icon>save</mat-icon>SAVE
            </button>
            <button mat-button (click)="_onCancelButtonClick()">
                <mat-icon>cancel</mat-icon>CLOSE
            </button>
        </div>
    </form>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentLeaseFormComponent {
    readonly _fb = inject(FormBuilder);
    readonly _labService = inject(LabService);
    readonly _equipmentService = inject(EquipmentService);
    readonly _installationService = inject(EquipmentInstallationService)

    lease = input<EquipmentLease>();
    isResumbission = computed(() => this.lease() !== undefined);

    consumer = input.required<LabAllocationConsumer>();

    lab$ = toObservable(this.consumer).pipe(
        switchMap(consumer => this._labService.fetch(consumer.labId))
    );

    disciplineHint = input<Discipline>();


    isCreate = computed(() => this.lease() !== undefined);
    installation = input<EquipmentInstallation>();

    @Output()
    readonly submit = new EventEmitter<CreateEquipmentLease>();

    @Output()
    readonly cancel = new EventEmitter<void>();

    readonly form = this._fb.group({
        equipment: this._fb.control<Equipment | NotFoundValue | null>(null),
        equipmentTrainingAcknowlegements: this._fb.control<string[]>([], { nonNullable: true }),
        numRequired: this._fb.control<number>(1, {
            validators: [
                Validators.required,
                Validators.min(1)
            ]
        }),

        startDate: this._fb.control<Date | null>(null),
        endDate: this._fb.control<Date | null>(null),
    });

    get equipmentNotFound(): NotFoundValue | null {
        const existingEquipment = this.form.value.equipment;
        if (existingEquipment instanceof NotFoundValue) {
            return existingEquipment
        }
        return null;
    }

    get equipmentName(): string | null {
        const equipment = this.form.value.equipment;
        if (equipment instanceof Equipment) {
            return equipment.name;
        } else if (equipment instanceof NotFoundValue) {
            return equipment.searchInput;
        }
        return null;
    }

    readonly currentInstallCount$: Observable<number | 'unknown'> = this.form.valueChanges.pipe(
        startWith(this.form.value),
        withLatestFrom(this.lab$),
        switchMap(([formValue, lab]) => {
            const equipment = formValue.equipment;
            if (equipment instanceof Equipment) {
                return equipment.getInstallation(lab, this._installationService)
            }
            return of(null);
        }),
        map(installation => installation?.numInstalled || 'unknown')
    );

    get equipmentTrainingDescriptions(): string[] | null {
        const equipment = this.form.value.equipment;
        if (equipment instanceof Equipment) {
            return equipment.trainingDescriptions;
        }
        return null;
    }

    get numRequiredErrors() {
        return this.form.controls.numRequired.errors;
    }

    constructor() {
        const syncLease = toObservable(this.lease).pipe(
            switchMap(async lease => {
                if (lease) {
                    const equipment = await firstValueFrom(this._equipmentService.fetch(lease.equipmentId));

                    this.form.setValue({
                        equipment,
                        numRequired: lease.numRequired,
                        equipmentTrainingAcknowlegements: lease.equipmentTrainingAcknowledgements,
                        startDate: lease.startDate,
                        endDate: lease.endDate
                    });
                }

            })
        ).subscribe();

        inject(DestroyRef).onDestroy(() => {
            syncLease.unsubscribe();
        })
    }

    _onCancelButtonClick() {
        this.cancel.emit(undefined);
    }

    _onSubmit() {
        const value = this.form.value;

        const request: CreateEquipmentLease = {
            consumerType: this.consumer().type,
            consumer: this.consumer().id,
            numRequired: value.numRequired!,
            equipmentTrainingAcknowledgements: value.equipmentTrainingAcknowlegements || [],
            startDate: value.startDate || null,
            endDate: value.endDate || null
        };

        this.submit.next(request);
    }
}