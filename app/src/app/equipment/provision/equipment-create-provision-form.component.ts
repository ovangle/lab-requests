import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { Equipment, EquipmentCreateRequest } from "../equipment";
import { Lab } from "src/app/lab/lab";
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { EquipmentInstallation } from "../installation/equipment-installation";
import { MatRadioModule } from "@angular/material/radio";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { MatInputModule } from "@angular/material/input";
import { TextFieldModule } from "@angular/cdk/text-field";
import { AbstractEquipmentProvisionService, CreateEquipmentProvisionRequest, EquipmentProvision } from "./equipment-provision";
import { firstValueFrom } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

export function equipmentProvisionCreateFormGroup() {
    return new FormGroup({
        reason: new FormControl<string>('', { nonNullable: true }),
        quantityRequired: new FormControl<number>(1, { nonNullable: true, validators: [ Validators.min(1) ] }),
        fundingSource: new FormControl<'lab-budget' | 'research-budget'>('lab-budget', { nonNullable: true })
    });
}

export type EquipmentProvisionCreateFormGroup = ReturnType<typeof equipmentProvisionCreateFormGroup>;

function isEquipmentProvisionCreateFormGroup(o: unknown): o is EquipmentProvisionCreateFormGroup {
    if (!(o instanceof FormGroup)) {
        return false;
    }
    const controlKeys = new Set(Object.keys(o.controls));
    return controlKeys.has('reason')
        && controlKeys.has('quantityRequired')
        && controlKeys.has('fundingSource');
}

export function equipmentProvisionCreateRequestFromForm(
    equipment: Equipment | EquipmentCreateRequest,
    lab: Lab,
    form: EquipmentProvisionCreateFormGroup
): CreateEquipmentProvisionRequest {
    if (!form.valid) {
        throw new Error('Invalid form has no value')
    }
    const value = form.value;
    return {
        status: 'requested',
        equipment: equipment,
        lab: lab,
        quantityRequired: value.quantityRequired || 1,
        reason: value.reason!,
    }
}

@Component({
    selector: 'equipment-provision-create-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        TextFieldModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatRadioModule,
        MatInputModule,
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="_onFormSubmit()">
        <!--
            This is really not for an equipment requester to know or care about. 
            It should be on provision approval 

            So requested -> one of 'request-purchase', 'request-relocate', 'installed']

        <div class="request-status-field">
            <p>This equipment:</p>
            <mat-radio-group formControlName="status">
                @if (isNewInstallation) {
                    <mat-radio-button value="requested">
                        is being requested as additional equipment for the lab.
                    </mat-radio-button>
                    <mat-radio-button value="installed">
                        already exists in the lab and needs to be added to the equipment registry
                    </mat-radio-button>
                }
            </mat-radio-group>
        </div>
        -->
        <mat-form-field>
            <mat-label>{{isNewInstallation ? 'Quantity' : 'Additional quantity'}} required</mat-label>
            <input matInput type="number"
                   formControlName="quantityRequired" 
                   required >
        </mat-form-field>
        
        <mat-form-field>
            <mat-label>Reason for request</mat-label>
            <textarea matInput cdkResizeTextarea
                      formControlName="reason">
            </textarea>
        </mat-form-field>

        @if (_isStandaloneForm) {
            <div class="form-controls">
                <button mat-button type="submit">
                    <mat-icon>save</mat-icon>save
                </button>
            </div>
        }
    </form>
    `
})
export class EquipmentProvisionCreateFormComponent {
    _provisionService = inject(AbstractEquipmentProvisionService, { optional: true });
    _controlContainer = inject(ControlContainer, { optional: true })

    @Input({ required: true })
    equipment: Equipment | EquipmentCreateRequest | undefined;

    @Input({ required: true })
    lab: Lab | undefined;

    @Input()
    get quantityRequired(): number {
        return this._quantityRequired;
    }
    set quantityRequired(value: NumberInput) {
        this._quantityRequired = coerceNumberProperty(value);
        this.form.patchValue({ quantityRequired: this._quantityRequired })
    }
    _quantityRequired: number = 1;

    @Output()
    readonly save = new EventEmitter<EquipmentProvision>();

    get installation(): EquipmentInstallation | null {
        if (this.equipment instanceof Equipment) {
            return this.equipment!.currentLabInstallation(this.lab!);
        }
        return null;
    }
    get isNewInstallation(): boolean {
        return this.installation === null || this.installation.numInstalled === 0;
    }

    get form(): EquipmentProvisionCreateFormGroup {
        if (this._controlContainer != null) {
            const c = this._controlContainer.control;
            if (!isEquipmentProvisionCreateFormGroup(c)) {
                throw new Error(`control container must be bound to equipment provision create form`)
            }
            return c;
        }
        if (this._standaloneFormGroup == null) {
            this._standaloneFormGroup = equipmentProvisionCreateFormGroup();
        }
        return this._standaloneFormGroup;
    }
    _standaloneFormGroup: EquipmentProvisionCreateFormGroup | undefined;
    get _isStandaloneForm() {
        return this._controlContainer == null;
    }

    async _onFormSubmit() {
        if (!this.form.valid) {
            throw new Error('Invalid form has no value')
        }

        if (!this._provisionService) {
            throw new Error('Standalone form requires an equipment context');
        }

        const created = await firstValueFrom(
            this._provisionService.create({
                status: 'requested',
                equipment: this.equipment!,
                lab: this.lab!,
                quantityRequired: this.form.value.quantityRequired!,
                reason: this.form.value.reason!,
            })
        );
        this.save.next(created);
    }
}
