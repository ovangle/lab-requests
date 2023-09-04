import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { WorkUnit } from "./work-unit";
import { Campus } from "src/app/uni/campus/campus";
import { CampusInfoComponent } from "src/app/uni/campus/campus-info.component";


@Component({
    selector: 'lab-req-work-unit-campus-lab-info',
    standalone: true,
    imports: [
        CommonModule, 
        CampusInfoComponent
    ],
    template: `
    <h3>
        <app-uni-campus-info [campus]="workUnit.campus">
        </app-uni-campus-info>    
        - {{workUnit.labType}} lab</h3>
    <dl>
        <dt>Technician</dt><dd>{{workUnit.technician}}</dd>
    </dl>
    `
})
export class WorkUnitCampusLabInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;

}