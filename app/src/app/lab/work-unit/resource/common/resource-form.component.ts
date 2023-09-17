import { CommonModule } from "@angular/common";
import { Component, DestroyRef, InjectionToken, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ResourceFormTitleComponent } from "./resource-form-title.component";
import { Resource } from '../resource';
import { ResourceFormService } from "../resource-form.service";

@Component({
    selector: 'lab-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule,
        ResourceFormTitleComponent
    ],
    template: `
        <ng-container *ngIf="form">
           <ng-content></ng-content>
        </ng-container>
    `
})
export class ResourceFormComponent<T extends Resource, TForm extends FormGroup<any>> {
    readonly resourceFormService = inject(ResourceFormService<T, TForm>);

    get resourceType() {
        return this.resourceFormService._typeIndex[0];
    }
    get resourceIndex() {
        return this.resourceFormService._typeIndex[1];
    }

    get form(): TForm {
        return this.resourceFormService.form as TForm;
    }

    get isCreate(): boolean {
        return this.resourceFormService.isCreate;
    }
}

