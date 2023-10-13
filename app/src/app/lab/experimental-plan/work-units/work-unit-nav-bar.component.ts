import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, Output, inject } from "@angular/core";
import { MatTabNavPanel, MatTabsModule } from "@angular/material/tabs";
import { ExperimentalPlan } from "../experimental-plan";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { map, tap } from "rxjs";


@Component({
    selector: 'lab-plan-work-unit-nav-bar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatIconModule,
        MatTabsModule
    ],
    template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel"
        mat-align-tabs="start"
        mat-stretch-tabs="false">
        <a mat-tab-link *ngFor="let workUnit of plan.workUnits; let index=index"
           [routerLink]="['./', 'work-units', index]"
           routerLinkActive #linkActive="routerLinkActive" (isActiveChange)="activeChange.emit()"
           [active]="linkActive.isActive">
            {{workUnit.campus.name}} - {{workUnit.labType}}
        </a>
        <div class="spacer" [style.flex-grow]="1"></div>
        <a mat-tab-link
            routerLink="./work-units/create"
            routerLinkActive #linkActive="routerLinkActive" (isActiveChange)="activeChange.emit()"
            [active]="linkActive.isActive"
            [disabled]="isAddingWorkUnit$ | async">
            <mat-icon>+</mat-icon>
        </a>
    </nav>
    `
})
export class ExperimentalPlanWorkUnitsNavBar {
    readonly _activatedRoute = inject(ActivatedRoute);

    @Input({required: true})
    plan: ExperimentalPlan;

    @Input({required: true})
    tabPanel: MatTabNavPanel;

    @Output()
    activeChange = new EventEmitter<void>();

    readonly isAddingWorkUnit$ = this._activatedRoute.url.pipe(
            map(url => url.some(segment => segment.path.includes('create'))),
    );
}