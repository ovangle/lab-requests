import { CommonModule } from "@angular/common";
import { WorkUnit } from "../work-unit";
import { Component, Input } from "@angular/core";
import { CampusInfoComponent } from "src/app/uni/campus/campus-info.component";

@Component({
    selector: 'lab-work-unit-base-info',
    standalone: true,
    imports: [
        CommonModule, 
        CampusInfoComponent
    ],
    template: `
    <dl>
        <dt>Technician</dt><dd>{{workUnit.technician}}</dd>
        <dt>Process Summary</dt>
        <dd>
            <ng-container *ngIf="workUnit.processSummary; else unknownProcess">
                {{workUnit.processSummary}}
            </ng-container>

            <ng-template #unknownProcess>
                <p><i>No process description provided</i>
            </ng-template>
        </dd>
    </dl>
    `
})
export class WorkUnitBaseInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;
}