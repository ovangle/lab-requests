import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Injectable, OnDestroy, OnInit, Output, inject } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject, Subject, Subscription, combineLatest, switchMap, tap } from "rxjs";
import { WorkUnit, WorkUnitContext, WorkUnitModelService } from "./work-unit";
import { ExperimentalPlanContext, ExperimentalPlan } from "../experimental-plan";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatListModule } from "@angular/material/list";

interface WorkUnitFilters {
    researcher?: string;
    supervisor?: string;
    technician?: string;
}

@Injectable()
export class WorkUnitIndexService {
    readonly models = inject(WorkUnitModelService);

    readonly activeFilters = new BehaviorSubject<Readonly<WorkUnitFilters>>({});

    setFilters(filters: WorkUnitFilters) {
        this.activeFilters.next({...this.activeFilters.value, ...filters});
    }

    readonly workUnits$: Observable<WorkUnit[]> = this.activeFilters.pipe(
        switchMap(filters => this.models.query(filters))
    );
}


@Injectable()
export class WorkUnitIndexContext extends WorkUnitContext {
    readonly focusedSubject = new ReplaySubject<WorkUnit | null>(1);
    readonly fromContext$ = this.focusedSubject.asObservable();

    setFocus(workUnit: WorkUnit | null) {
        this.focusedSubject.next(workUnit);
    }

    override connect() {
        const sSubscription = super.connect();
        return new Subscription(() => {
            sSubscription.unsubscribe();
            this.focusedSubject.complete();
        });
    }
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatListModule
        
    ],
    template: `
    <mat-list>
        <div *ngFor="let item of workUnits">
            {{workUnit.name}}
        </div>
    </mat-list>
    `,
    providers: [
        WorkUnitIndexContext
    ]
})
export class WorkUnitIndexPage implements OnDestroy {
    readonly _context = inject(WorkUnitIndexContext);
    readonly _contextConnection: Subscription;

    constructor() {
        this._contextConnection = this._context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

    setFocus(workUnit: WorkUnit | null) {
        this._context.setFocus(workUnit);
    }
}

