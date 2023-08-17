import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { Campus, campusName } from "src/app/lab/experimental-plan/campus/campus";

@Component({
    selector: 'lab-req-provision-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,
    ],
    template: `

    <ng-container [formGroup]="form">


        <div class="is-university-supplied">
            <div>This {{resourceType}} is to be supplied:</div>
                <mat-radio-group formControlName="isUniversitySupplied">
                    <mat-radio-button [value]="false">By the researcher</mat-radio-button>
                    <mat-radio-button [value]="true">By the university</mat-radio-button>
                </mat-radio-group>
            </div>


        <ng-container *ngIf="form.value.isUniversitySupplied">
            <mat-form-field>
                <mat-label>Estimated cost</mat-label>

                <input matInput type="number" formControlName="estimatedCost">
                <div matTextPrefix>$</div>
                <div matTextSuffix>{{provisioningUnit}}</div>
            </mat-form-field>
        </ng-container>
    </ng-container>
    `
})
export class ProvisionForm {
    @Input()
    atCampus: Campus | null;

    get atCampusName() {
        return campusName(this.atCampus);
    }

    @Input()
    numAvailableUnits: number | null;

    @Input()
    form: FormGroup<any>;

    @Input()
    resourceType: string;

    @Input()
    provisioningUnit: string;
}