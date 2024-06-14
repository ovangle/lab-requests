import { Component, inject, input } from "@angular/core";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, isLabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
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
import { ResearchFunding } from "src/app/research/funding/research-funding";

export type UpgradeSoftwareVersionFormGroup = LabProvisionCreateFormGroup<{
    minVersion: FormControl<string>;
}>;

function isUpgradeSoftwareVersionFormGroup(obj: unknown): obj is UpgradeSoftwareVersionFormGroup {
    return isLabProvisionCreateFormGroup([ 'minVersion' ], obj);
}

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
    value: UpgradeSoftwareVersionFormGroup[ 'value' ],
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
export class SoftwareUpgradeProvisionCreateFormComponent
    extends AbstractLabProvisionCreateFormComponent<SoftwareProvision, UpgradeSoftwareVersionFormGroup, UpgradeSoftwareVersionRequest> {


    readonly _softwareProvisionService = inject(SoftwareProvisionService);

    protected override __isFormGroupInstance = isUpgradeSoftwareVersionFormGroup;
    protected override __createStandaloneForm = upgradeSoftwareVersionFormGroup;
    protected override readonly __createRequestFromFormValue = upgradeSoftwareVersionRequestFromFormValue

    ngOnInit() {
        this.form.patchValue({
            numRequired: 1,
            unit: 'install',
            hasCostEstimates: false
        }, { emitEvent: false });
    }
}