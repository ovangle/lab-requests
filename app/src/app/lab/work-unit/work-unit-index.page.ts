import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Injectable, OnDestroy, OnInit, Output, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest, tap } from "rxjs";
import { WorkUnit, WorkUnitContext, WorkUnitModelService } from "./work-unit";
import { ExperimentalPlanContext, ExperimentalPlan } from "../experimental-plan/experimental-plan";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";


@Injectable()
export class WorkUnitIndexContext extends WorkUnitContext {
    override workUnit$: Observable<WorkUnit>;
    readonly focusedSubject = new Subject<WorkUnit | null>();
    readonly fromContext$ = this.focusedSubject.asObservable();

    setFocus(workUnit: WorkUnit | null) {
        this.focusedSubject.next(workUnit);
    }

    destroy() {
        this.focusedSubject.complete();
    }
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    `,
    providers: [
        WorkUnitIndexContext
    ]
})
export class WorkUnitIndexPage implements OnDestroy {
    readonly _context = inject(WorkUnitIndexContext);

    @Output()
    readonly focused = this._context.workUnit$;

    ngOnDestroy() {
        this._context.destroy();
    }

    setFocus(workUnit: WorkUnit | null) {
        this._context.setFocus(workUnit);
    }
}

