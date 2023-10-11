import { Component, Input } from "@angular/core";
import { WorkUnit } from "../work-unit";
import { CommonModule } from "@angular/common";
import { MatDatepickerModule } from "@angular/material/datepicker";

@Component({
    selector: 'lab-work-unit-duration-info',
    standalone: true,
    imports: [
        CommonModule,
        MatDatepickerModule
    ],
    template: `
    {{startDate | date}} - 
    <ng-container *ngIf="endDate; else noEndDate">
        {{workUnit.endDate | date}}
    </ng-container>

    <ng-template #noEndDate>?</ng-template>

    <mat-date-range-picker />

    <mat-datepicker>
    </mat-datepicker>

    `
})
export class WorkUnitDurationInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;

    get startDate(): Date {
        return this.workUnit.startDate || new Date();
    }

    get endDate(): Date | null {
        return this.workUnit.endDate;
    }
}