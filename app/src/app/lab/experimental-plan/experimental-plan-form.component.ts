import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { defer, map } from "rxjs";
import { CampusSearchComponent } from "src/app/uni/campus/campus-search.component";
import { DisciplineSelectComponent } from "src/app/uni/discipline/discipline-select.component";
import { FundingModelSelectComponent } from "../../uni/research/funding-model/funding-model-select.component";
import { Equipment } from "../equipment/equipment";
import { ExperimentalPlan, ExperimentalPlanPatch, ExperimentalPlanPatchErrors } from "./experimental-plan";
import { ExperimentalPlanResearcherFormComponent } from "./researcher/researcher-form.component";
import { ExperimentalPlanForm, experimentalPlanPatchFromForm } from "./experimental-plan-form.service";
import { ExperimentalPlanCreateDefaultWorkUnitForm } from "./work-units/create-default-work-unit-form.component";


@Component({
    selector: 'lab-experimental-plan-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,

        DisciplineSelectComponent,
        FundingModelSelectComponent,
        CampusSearchComponent,
        ExperimentalPlanResearcherFormComponent,
        ExperimentalPlanCreateDefaultWorkUnitForm
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label for="title">Project title</mat-label>

            <input matInput type="text" id="title" formControlName="title" required />

            <mat-error *ngIf="titleErrors?.required">
                A value is required
            </mat-error>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Experimental Plan Summary</mat-label>
            <textarea matInput id="process-summary" formControlName="processSummary">
            </textarea>
        </mat-form-field>

        <lab-experimental-plan-researcher-form 
            [form]="form">
        </lab-experimental-plan-researcher-form>

        <uni-research-funding-model-select formControlName="fundingModel">
            <mat-label>Funding source</mat-label>

            <mat-error *ngIf="fundingModelErrors?.required">
                A value is required
            </mat-error>
        </uni-research-funding-model-select>

        <ng-container *ngIf="isCreate">

            <lab-experimental-plan-create-default-work-unit-form 
                [form]="form">
            </lab-experimental-plan-create-default-work-unit-form>
        </ng-container>

        <ng-container [ngTemplateOutlet]="controls" [ngTemplateOutletContext]="formControlContext$ | async">
        </ng-container>
    </form>
    `,
    styles: [`
        mat-card + mat-card {
            margin-top: 1em;
        }

        mat-form-field {
            width: 100%;
        }

        .researcher-details {
            padding-left: 3em;
        }
    `]
})
export class ExperimentalPlanFormComponent {
    @Input()
    committed: Equipment | null = null;

    @Input({required: true})
    form: ExperimentalPlanForm;

    @Output()
    requestCommit = new EventEmitter<ExperimentalPlanPatch>();

    @Output()
    requestReset = new EventEmitter<void>();

    get isCreate() {
        return this.committed === null;
    }

    get titleErrors(): ExperimentalPlanPatchErrors['title'] | null {
        return this.form.controls['title'].errors || null as any;
    }

    get fundingModelErrors(): ExperimentalPlanPatchErrors['fundingModel'] | null {
        return this.form.controls['fundingModel'].errors || null as any;
    }

    @Input()
    controls: TemplateRef<{
        $implicit: ExperimentalPlanForm,
        committable: boolean,
        doCommit: () => void,
        doReset: () => void
    }>;

    @Input()
    get disabled(): boolean {
        return this.form.disabled;
    }
    set disabled(value: BooleanInput) {
        const isDisabled = coerceBooleanProperty(value);
        if (isDisabled  && !this.form.disabled) {
            this.form.disable();
        } 
        if (!isDisabled && this.form.disabled) {
            this.form.enable();
        }
    }
    
    readonly formControlContext$ = defer(() => this.form.statusChanges.pipe(
        map(() => ({
            $implicit: this.form,
            committable: this.form.valid,
            doCommit: () => {
                const patch = experimentalPlanPatchFromForm(this.form)
                this.requestCommit.emit(patch);
            },
            doReset: () => this.requestReset.emit()
        }))
    ));
}
