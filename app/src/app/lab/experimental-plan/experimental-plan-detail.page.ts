import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { ExperimentalPlanFormComponent } from "./experimental-plan-form.component";
import { ExperimentalPlan, ExperimentalPlanContext } from "./experimental-plan";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, map, shareReplay, switchMap } from "rxjs";
import { MatCardModule } from "@angular/material/card";

@Injectable()
export class ExperimentalPlanDetailContext extends ExperimentalPlanContext {
    readonly activatedRoute = inject(ActivatedRoute);

    readonly fromContext$: Observable<ExperimentalPlan> = this.activatedRoute.paramMap.pipe(
        map(paramMap => paramMap.get('experimentalPlanId')),
        switchMap(experimentalPlanId => {
            if (experimentalPlanId == null) {
                throw new Error('No experimental plan in map');
            }
            return this.models.fetch(experimentalPlanId);
        }),
        shareReplay(1)
    );

    override connect() {
        const sConnection = super.connect();
        const fromContextKeepalive = this.fromContext$.subscribe();
        return new Subscription(() => {
            sConnection.unsubscribe();
            fromContextKeepalive.unsubscribe();
        });
    }
}


@Component({
    selector: 'app-lab-experimental-plan-detail-page',
    standalone: true,
    imports: [
        CommonModule,
        ExperimentalPlanFormComponent,

        MatCardModule,
        MatTabsModule
    ],
    template: `
    <app-lab-experimental-plan-form [disabled]="!isEditingForm">
    </app-lab-experimental-plan-form>

    <mat-card *ngIf="plan$ | async as plan">
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
                            [routerLink]="['./', 'work-units', plan.workUnits.length]"
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

    <div class="resource-form-pane">
        <div class="sticky">
            <router-outlet name="resource-details"></router-outlet>
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

    .resource-form-pane .sticky-container {
        width: 100%;
        height: 100vh;
        position: sticky;
        top: 0;
    }
    `],
    providers: [
        {
            provide: ExperimentalPlanContext,
            useClass: ExperimentalPlanDetailContext
        }
    ]
})
export class ExperimentalPlanDetailPage {
    readonly isEditingForm = true;
    readonly _context = inject(ExperimentalPlanContext);
    _contextConnection: Subscription;

    readonly plan$ = this._context.plan$;

    constructor() {
        this._contextConnection = this._context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}