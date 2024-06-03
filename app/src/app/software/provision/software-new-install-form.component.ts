import { Component, inject, input } from "@angular/core";
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { SoftwareInstallation, SoftwareInstallationCreateRequest } from "../installation/software-installation";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { NewSoftwareRequest, SoftwareProvision, SoftwareProvisionService } from "./software-provision";
import { LabProvisionCreateRequest } from "src/app/lab/common/provisionable/provision";
import { Software } from "../software";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable } from "rxjs";
import { Lab } from "src/app/lab/lab";
import { SoftwareUpgradeProvisionCreateFormComponent } from "./software-upgrade-install-form.component";
import { CostEstimateFormGroup, ResearchFundingCostEstimateFormComponent, costEstimateFormGroup, costEstimateFromFormValue } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { MatCheckbox } from "@angular/material/checkbox";
import { format } from "date-fns";

export type NewSoftwareFormGroup = LabProvisionCreateFormGroup<{
    minVersion: FormControl<string>;
    requiresLicense: FormControl<boolean>;
}>;

export function newSoftwareFormGroup(
    defaultFunding?: ResearchFunding
): NewSoftwareFormGroup {
    return labProvisionCreateFormGroup({
        minVersion: new FormControl<string>('', { nonNullable: true }),
        requiresLicense: new FormControl<boolean>(false, { nonNullable: true }),
    })
}

export function newSoftwareRequestFromFormValue(
    target: SoftwareInstallationCreateRequest,
    value: NewSoftwareFormGroup['value'],
): NewSoftwareRequest {
    return {
        ...labProvisionCreateRequestFromFormValue(
            'new_software',
            target,
            value
        ),
        minVersion: value.minVersion!,
    };
}


@Component({
    selector: 'software-new-software-install-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,

        MatButton,
        MatCheckbox,
        MatFormFieldModule,
        MatIcon,

        ResearchFundingCostEstimateFormComponent,
        SoftwareUpgradeProvisionCreateFormComponent
    ],
    template: `
    @if (currentInstallation(); as installation) {
        <!-- If this software is already installed in the current lab,
             then replace this with a request to upgrade the software
             if necessary 
        -->
        <software-upgrade-install-form 
            [formGroup]="form"
            [currentInstallation]="installation" />
    } @else {
        <form [formGroup]="form" (ngSubmit)="onFormSubmit()">

        <mat-checkbox formControlName="requiresLicense">
            This software requires the signing of a license agreement
        </mat-checkbox>

        @if (form.value.requiresLicense) {
            <mat-checkbox formControlName="hasCostEstimates">
                This software is paid software.
            </mat-checkbox>
        }

        @if (form.value.hasCostEstimates) {
            <research-funding-cost-estimate-form formGroupName="estimatedCost"
                [funding]="funding()" 
                [quantityRequired]="[1, 'install']"
            />
        }

        @if (isStandaloneForm) {
            <div class="form-controls">
                <button mat-button type="submit">
                    <mat-icon>save</mat-icon>
                </button>
            </div>
        }
        </form>
    }
    `
})
export class NewSoftwareProvisionCreateFormComponent
    extends AbstractLabProvisionCreateFormComponent<SoftwareInstallation, SoftwareProvision, NewSoftwareFormGroup> {
    readonly _softwareProvisionService = inject(SoftwareProvisionService);
    readonly _controlContainer = inject(ControlContainer, { optional: true });

    software = input.required<Software>();
    lab = input.required<Lab>();

    funding = input<ResearchFunding>();

    currentInstallation = input<SoftwareInstallation>();

    _standaloneForm: NewSoftwareFormGroup | undefined;
    get isStandaloneForm() { return this._standaloneForm !== undefined; }

    override get form(): NewSoftwareFormGroup {
        if (this._controlContainer?.control instanceof FormGroup) {
            return this._controlContainer?.control;
        }
        if (this._standaloneForm === undefined) {
            this._standaloneForm = newSoftwareFormGroup(this.funding());
        }
        return this._standaloneForm;
    }

    override createFromForm(form: NewSoftwareFormGroup): Observable<SoftwareProvision> {
        if (!form.valid) {
            throw new Error('Invalid form has no value');
        }
        const request = newSoftwareRequestFromFormValue(
            { software: this.software(), lab: this.lab() },
            this.form.value
        )

        return this._softwareProvisionService.newSoftware(request);
    }
}