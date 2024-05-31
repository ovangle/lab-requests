import { Component, inject, input } from "@angular/core";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { Software } from "../software";
import { ControlContainer, FormControl, FormGroup, Validators } from "@angular/forms";
import { SoftwareInstallation } from "../installation/software-installation";
import { SoftwareProvision, UpgradeSoftwareVersionRequest } from "./software-provision";
import { LabProvisionCreateRequest } from "src/app/lab/common/provisionable/provision";

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


@Component({
    selector: 'software-upgrade-provision-create-form',
    standalone: true,
    imports: [

    ],
    template: ``

})
export class SoftwareUpgradeProvisionCreateFormComponent
    extends AbstractLabProvisionCreateFormComponent<SoftwareInstallation, SoftwareProvision, SoftwareUpgradeFormGroup> {

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

    override createRequestFromForm(form: UpgradeSoftwareVersionFormGroup): UpgradeSoftwareVersionRequest {
        if (!form.valid) {
            throw new Error('Invalid form has no value');
        }

        return {
            type: 'upgrade_software',
            currentInstallation: this.currentInstallation(),
            minVersion: form.value.minVersion!
        };
    }

}