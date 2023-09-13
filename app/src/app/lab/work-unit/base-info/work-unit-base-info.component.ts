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
    <h3>
        <uni-campus-info [campus]="workUnit.campus" nameOnly>
        </uni-campus-info>    
        - {{workUnit.labType}} lab</h3>
    <dl>
        <dt>Technician</dt><dd>{{workUnit.technician}}</dd>
        <dt>Process</dt><dd>{{workUnit.processSummary}}</dd>
    </dl>
    `
})
export class WorkUnitBaseInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;
}