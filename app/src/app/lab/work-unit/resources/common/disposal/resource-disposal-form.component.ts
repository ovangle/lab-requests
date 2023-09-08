import { Component, inject } from "@angular/core";
import { RESOURCE_DISPOSAL_TYPES, ResourceDisposalForm } from "./resource-disposal";
import { ControlContainer, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatSelectModule } from "@angular/material/select";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { ProvisionFormComponent } from "../provision/provision-form.component";


@Component({
    selector: 'lab-req-resource-disposal-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatSelectModule,

        SelectOtherDescriptionComponent,

        ProvisionFormComponent,
    ],
    template: `
    <div class="container" [formGroup]="formGroup">
        <mat-form-field>
            <mat-label>Type</mat-label>
            <mat-select formControlName="type">
                <mat-option *ngFor="let disposalType of disposalTypes" [value]="disposalType">
                    {{disposalType}}
                </mat-option>
            </mat-select>
        </mat-form-field>

        <lab-req-select-other-description
            [isOtherSelected]="formGroup.value['type'] === 'other'"
            formControlName="otherDescription">
        </lab-req-select-other-description>

        <lab-req-provision-form [form]="formGroup"
            [canResearcherSupply]="false">
        </lab-req-provision-form>

    </div>
    `,
    styles: [`
    .container {
        display: flex;
    }
    `]
})
export class ResourceDisposalFormComponent {
    readonly disposalTypes = RESOURCE_DISPOSAL_TYPES;

    _controlContainer = inject(ControlContainer);

    get formGroup(): ResourceDisposalForm {
        return this._controlContainer.control as ResourceDisposalForm;
    }
}