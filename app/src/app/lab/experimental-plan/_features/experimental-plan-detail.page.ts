import { Component, ElementRef, ViewChild, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, map, shareReplay, switchMap } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanModelService } from "../experimental-plan";
import { ExperimentalPlanFormPaneControlService } from "../experimental-plan-form-pane-control.service";

export function experimentalPlanContextFromDetailRoute(): Observable<ExperimentalPlan> {
    const activatedRoute = inject(ActivatedRoute);
    const models = inject(ExperimentalPlanModelService);

    return activatedRoute.paramMap.pipe(
        map(paramMap => paramMap.get('experimental_plan_id')),
        switchMap(experimentalPlanId => {
            if (experimentalPlanId == null) {
                throw new Error('No experimental plan in params');
            }
            return models.fetch(experimentalPlanId);
        })
    );
}

@Component({
    selector: 'lab-experimental-plan-detail-page',
    template: `
    <ng-container *ngIf="plan$ | async as plan">
        <lab-experimental-plan-info [plan]="plan"></lab-experimental-plan-info>
        <mat-card>
            <mat-card-header>
                <nav mat-tab-nav-bar [tabPanel]="tabPanel"
                    mat-align-tabs="start"
                    mat-stretch-tabs="false">
                    <a mat-tab-link *ngFor="let workUnit of plan.workUnits; let index=index"
                            [routerLink]="['./', 'work-units', index]" routerLinkActive #linkActive="routerLinkActive"
                            [active]="linkActive.isActive">
                        {{workUnit.campus.name}} - {{workUnit.labType}}
                    </a>
                    <div class="spacer" [style.flex-grow]="1"></div>
                    <a mat-tab-link
                                routerLink="./work-units/create"
                                routerLinkActive #linkActive="routerLinkActive"
                                [active]="linkActive.isActive"
                                [disabled]="isAddingWorkUnit(plan)">
                        <mat-icon>+</mat-icon>
                    </a>
                </nav>
            </mat-card-header>

            <mat-card-content>
                <mat-tab-nav-panel #tabPanel>
                    <router-outlet></router-outlet>
                </mat-tab-nav-panel>
            </mat-card-content>
        </mat-card>
    </ng-container>
    <div class="resource-form-pane" [class.resource-form-pane-isopen]="_formPaneService.isOpen$ | async">
        <div class="sticky-top">
            <router-outlet name="form"></router-outlet>
        </div>
    </div>
    `,
    styles: [`
    :host {
        display: block;
        position: relative;
    }

    .resource-form-pane {
        position: absolute;
        top: 0;
        right: -16px;
        height: 100%;
        max-width: 40vw;
        background-color: white;
        z-index: 100;
    }

    .resource-form-pane .sticky-top {
        width: 100%;
        height: 100vh;
        position: sticky;
        top: 0;
    }
    `],
    providers: [
        ExperimentalPlanFormPaneControlService
    ]
})
export class ExperimentalPlanDetailPage {
    readonly isEditingForm = true;
    readonly _context = inject(ExperimentalPlanContext);
    _contextConnection: Subscription;

    readonly _formPaneService = inject(ExperimentalPlanFormPaneControlService);
    @ViewChild(ElementRef, {static: true})
    readonly formPane: ElementRef<any>;

    readonly plan$ = this._context.plan$;

    constructor() {
        this._contextConnection = this._context.sendCommitted(
            experimentalPlanContextFromDetailRoute()
        );
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

    isAddingWorkUnit(plan: ExperimentalPlan) {
        return false;
    }

}