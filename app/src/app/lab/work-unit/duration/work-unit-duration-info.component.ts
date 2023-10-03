import { Component, Input } from "@angular/core";
import { WorkUnit } from "../work-unit";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'lab-work-unit-duration-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    {{startDate | date}} - 
    <ng-container *ngIf="endDate; else noEndDate">
        {{workUnit.endDate | date}}
    </ng-container>

    <ng-template #noEndDate>?</ng-template>
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