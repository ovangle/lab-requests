import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { WorkUnit } from "./work-unit";
import { Campus, campusName } from "src/app/uni/campus/campus";


@Component({
    selector: 'lab-req-work-unit-campus-lab-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    <h3>{{_campusName(workUnit.campus)}} - {{workUnit.labType}} lab</h3>

    <dl>
        <dt>Technician</dt><dd>{{workUnit.technician}}</dd>
    </dl>
    `
})
export class WorkUnitCampusLabInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;

    _campusName(campus: Campus) {
        return campusName(campus);
    }
}