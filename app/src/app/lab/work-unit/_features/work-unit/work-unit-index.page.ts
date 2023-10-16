import { CommonModule } from "@angular/common";
import { Component, OnDestroy, inject } from "@angular/core";
import { Subscription, of } from "rxjs";
import { WorkUnitContext, WorkUnit } from "../../common/work-unit";

@Component({
    selector: 'lab-work-unit-index',
    template: `
    `,
    providers: [
    ]
})
export class WorkUnitIndexPage {
    readonly _context = inject(WorkUnitContext);

    setFocus(workUnit: WorkUnit | null) {
        throw new Error('Not implemented');
    }
}

