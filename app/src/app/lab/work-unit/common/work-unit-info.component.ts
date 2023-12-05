import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { CampusInfoComponent } from "src/app/uni/campus/campus-info.component";
import { WorkUnit } from "./work-unit";
import { WorkUnitDurationInfoComponent } from "../duration/work-unit-duration-info.component";


@Component({
    selector: 'lab-work-unit-info',
    standalone: true,
    imports: [
        CommonModule,
        CampusInfoComponent,
        WorkUnitDurationInfoComponent
    ],
    template: `
    <dl class="basic-info">
        <dt>Name</dt>
            <dd>{{workUnit.name}}</dd>
        <dt>Process summary</dt>
        <dd>
            @if (workUnit.processSummary) {
                <p>{{workUnit.processSummary}}</p>
            } @else {
                <p><i>No process description provided</i>
            }
        </dd>
    </dl>

    <lab-work-unit-duration-info [workUnit]="workUnit" />
    `,
    styles: [`
    :host {
        display: flex;
    }
    dl.basic-info {
        flex-grow: 1;
    }
    lab-work-unit-duration-info {
        flex-grow: 0;
        flex-shrink: 0;
    }
    
    `]
})
export class WorkUnitInfoComponent {
    @Input({required: true})
    workUnit: WorkUnit;
}