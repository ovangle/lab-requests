import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { CommonMeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";

import { CampusInfoComponent } from 'src/app/uni/campus/campus-info.component';

@Component({
    selector: 'lab-resource-provision-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,

        CommonMeasurementUnitPipe
    ],
    template: `
    <ng-container [formGroup]="form">
        <div *ngIf="canResearcherSupply" class="is-university-supplied">
            <div>This {{resourceType}} is to be supplied:</div>
            <mat-radio-group formControlName="isUniversitySupplied">
                <mat-radio-button [value]="false">By the researcher</mat-radio-button>
                <mat-radio-button [value]="true">By the university</mat-radio-button>
            </mat-radio-group>
        </div>

        <ng-container *ngIf="isUniversitySupplied">
            <mat-form-field>
                <mat-label>Estimated cost</mat-label>
                <input matInput type="number" formControlName="estimatedCost">
                <div matTextPrefix>$</div>
                <div matTextSuffix>per <span [innerHTML]="provisioningUnit | commonMeasurementUnit"></span></div>
            </mat-form-field>
        </ng-container>
    </ng-container>

    <div *ngIf="totalCost">
        Total \${{totalCost}}
    </div>
    `
})
export class ProvisionFormComponent {
    @Input()
    numAvailableUnits: number | null;

    @Input()
    form: FormGroup<any>;

    @Input()
    resourceType: string;

    @Input()
    provisioningUnit: string;

    @Input()
    requestedUnits: number | null;

    @Input()
    get canResearcherSupply(): boolean {
        return this._canResearcherSupply;
    }
    set canResearcherSupply(input: BooleanInput) {
        this._canResearcherSupply = coerceBooleanProperty(input);
    }

    _canResearcherSupply: boolean = false;

    get isUniversitySupplied() {
        if (!this.canResearcherSupply) {
            return true;
        }
        const isUniversitySuppliedControl = this.form.get('isUniversitySupplied');
        if (!isUniversitySuppliedControl) {
            throw new Error('Missing isUniversitySuppliedControl');
        }
        return isUniversitySuppliedControl.value;
    }

    get totalCost() {
        if (this.provisioningUnit && this.requestedUnits) {
            const estimatedCost = this.form.value['estimatedCost'] || 0;
            return estimatedCost * this.requestedUnits;
        }
        return 0;
    }
}