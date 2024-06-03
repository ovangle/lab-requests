import { Component, inject, input } from "@angular/core";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { Software } from "../software";
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SoftwareInstallation } from "../installation/software-installation";
import { SoftwareProvision, SoftwareProvisionService, UpgradeSoftwareVersionRequest } from "./software-provision";
import { LabProvisionCreateRequest } from "src/app/lab/common/provisionable/provision";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatButton } from "@angular/material/button";
import { Observable } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatInput } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { ModelRef } from "src/app/common/model/model";

export type UpgradeSoftwareVersionFormGroup = LabProvisionCreateFormGroup<{
    minVersion: FormControl<string>;
}>;

export function upgradeSoftwareVersionFormGroup(): UpgradeSoftwareVersionFormGroup {
    return labProvisionCreateFormGroup({
        minVersion: new FormControl('', {
            nonNullable: true,
            validators: Validators.required
        })
    })
}

export function upgradeSoftwareVersionRequestFromFormValue(
    target: ModelRef<SoftwareInstallation>,
    value: UpgradeSoftwareVersionFormGroup['value'],
): UpgradeSoftwareVersionRequest {
    const labRequest = labProvisionCreateRequestFromFormValue(
        'upgrade_software',
        target,
        value,
    );

    return {
        ...labRequest,
        minVersion: value.minVersion!
    };
}

@Component({
    selector: 'software-upgrade-install-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatButton,
        MatIcon,
        MatInput,
    ],
    template: `
    Upgrade software version

    <form [formGroup]="form" (ngSubmit)="onFormSubmit()">
        <mat-form-field>
            <input matInput type="text" formControlName="minVersion" />
        </mat-form-field>

        @if (isStandaloneForm) {
            <div class="form-controls">
                <button mat-button type="submit">
                    <mat-icon>save</mat-icon>SAVE
                </button>
            </div>
        } 
    </form>
    `
})
export class SoftwareUpgradeProvisionCreateFormComponent extends AbstractLabProvisionCreateFormComponent<SoftwareInstallation, SoftwareProvision, UpgradeSoftwareVersionFormGroup> {

    readonly _softwareProvisionService = inject(SoftwareProvisionService);
    readonly _controlContainer = inject(ControlContainer, { optional: true });

    currentInstallation = input.required<SoftwareInstallation>();

    _isStandaloneForm = false;
    get isStandaloneForm() { return this._isStandaloneForm; }

    _form: UpgradeSoftwareVersionFormGroup | undefined;
    override get form(): UpgradeSoftwareVersionFormGroup {
        if (this._controlContainer?.control instanceof FormGroup) {
            return this._controlContainer?.control;
        }
        if (this._form === undefined) {
            this._form = upgradeSoftwareVersionFormGroup();
            this._isStandaloneForm = true;
        }
        return this._form;
    }

    override createFromForm(form: UpgradeSoftwareVersionFormGroup): Observable<SoftwareProvision> {
        if (!form.valid) {
            throw new Error('Invalid form has no value');
        }

        const request = upgradeSoftwareVersionRequestFromFormValue(
            this.currentInstallation(),
            form.value,
        );

        return this._softwareProvisionService.upgradeVersion(request);
    }

    ngOnInit() {
        this.form.patchValue({
            numRequired: 1,
            unit: 'install',
            hasCostEstimates: false
        });
    }

}