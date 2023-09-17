import { CommonModule } from "@angular/common";
import { Component, OnDestroy, inject } from "@angular/core";
import { Subscription, of } from "rxjs";
import { WorkUnit, WorkUnitContext } from "../../work-unit";

@Component({
    selector: 'lab-work-unit-index',
    template: `
    `,
    providers: [
    ]
})
export class WorkUnitIndexPage implements OnDestroy {
    readonly _context = inject(WorkUnitContext);
    _contextConnection: Subscription;

    constructor() {
        this._contextConnection = this._context.sendCommitted(of(null));
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

    setFocus(workUnit: WorkUnit | null) {
        throw new Error('Not implemented');
    }
}

