import { ChangeDetectorRef, Component, Inject, Injectable, Optional, SkipSelf, ViewChild, inject } from "@angular/core";
import { Subject, Subscription, filter, first, firstValueFrom, map, of } from "rxjs";
import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ActivatedRoute, Router } from "@angular/router";
import { experimentalPlanForm, experimentalPlanPatchFromForm } from "../common/experimental-plan-form";
import { WorkUnit, WorkUnitContext, WorkUnitCreate, WorkUnitPatch } from "../../work-unit/common/work-unit";
import { ExperimentalPlanPatch, ExperimentalPlanContext, ExperimentalPlan, ExperimentalPlanService, ExperimentalPlanCollection } from "../common/experimental-plan";
import { injectModelAdd } from "src/app/common/model/model-collection";
import { ModelContext } from "src/app/common/model/context";


const experimentalPlanCreateFixture: Partial<ExperimentalPlanPatch> = {
    title: 'The importance of being earnest',
    processSummary: 'Behave earnestly, then deceptively and observe changes.',
    fundingModel: 'Grant',
    researcher: 'a@researcher',
    researcherDiscipline: 'ICT',
    researcherBaseCampus: 'MEL',
    supervisor: null,
    addWorkUnits: []
};

@Component({
    selector: 'lab-experimental-plan-create-page',
    template: `
        <h1>Create experimental plan</h1>

        <lab-experimental-plan-form [form]="form">
            <div class="form-controls" 
                 (mouseenter)="_showAllFormErrors()">
                {{form.status}}
                {{form.errors | json}}
                <button mat-raised-button 
                        [disabled]="!form.valid" 
                        (click)="save(); $event.stopPropagation()">
                    <mat-icon>save</mat-icon> SAVE
                </button>
            </div>
        </lab-experimental-plan-form>
    `,
    styles: [`
    .form-controls {
        display: flex;
        justify-content: right;
    }
    `],
    providers: [
        ExperimentalPlanContext,
    ]
})
export class ExperimentalPlanCreatePage {
    readonly _cdRef = inject(ChangeDetectorRef);

    readonly _router = inject(Router);
    readonly _activatedRoute = inject(ActivatedRoute);

    readonly _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);

    readonly form = experimentalPlanForm();
    readonly patch$ = experimentalPlanPatchFromForm(this.form);

    ngAfterViewInit() {
        this.form.patchValue({
            ...experimentalPlanCreateFixture,
            addWorkUnits: []
        })
        this._cdRef.detectChanges();
    }
    
    readonly _add = injectModelAdd(ExperimentalPlanService, ExperimentalPlanCollection)

    async save() {
        if (!this.form.valid) {
            throw new Error('Cannot save invalid form');
        }
        const patch = await firstValueFrom(this.patch$);
        return await this._add(patch);
    }

    _showAllFormErrors() {
        this.form.markAllAsTouched();
    }
}