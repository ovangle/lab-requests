import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { ActivatedRoute, ParamMap, Routes } from "@angular/router";
import { BehaviorSubject, Connectable, Observable, Subscription, combineLatest, connectable as createConnectable, defer, distinctUntilChanged, firstValueFrom, map, of, tap, withLatestFrom } from "rxjs";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { WorkUnit, WorkUnitContext, WorkUnitModelService, WorkUnitPatch, WorkUnitPatchErrors } from "./work-unit";
import { Campus } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { LabType } from "../type/lab-type";
import { ResourceContainerFormControls, resourceContainerFormControls } from "./resources/resource-container-form";
import { WorkUnitBaseInfoComponent } from "./base-info/work-unit-base-info.component";
import { WorkUnitBaseInfoFormComponent } from "./base-info/work-unit-base-info-form.component";
import { WorkUnitFormService } from "./work-unit-form.service";

@Component({
    selector: 'lab-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        WorkUnitBaseInfoFormComponent,
        WorkUnitBaseInfoComponent,
    ],
    template: `
    <!--
    <lab-work-unit-base-info-form>
    </lab-work-unit-base-info-form>
-->

    <ng-container *ngIf="form" [formGroup]="form">
        <!--
            the work unit data capture process is in two steps.
            First, the campus, lab type and technician are selected using the work-unit-campus-lab-form
            Then the resources and all other info are captured using the remainder of the form.
            If there is a work unit in the committed experimental plan workUnits corresponding to this
            form, then display a read-only version of the previously captured info
        -->
        <ng-container *ngIf="isEditingCampusInfo$ | async; else campusDisciplineInfo">
            <lab-work-unit-base-info-form>
            </lab-work-unit-base-info-form>
        </ng-container>

        <ng-template #campusDisciplineInfo>
            <lab-work-unit-base-info [workUnit]="(workUnit$ | async)!">
            </lab-work-unit-base-info>
        </ng-template>

        <ng-container *ngIf="workUnit$ | async as workUnit">
          
        </ng-container>
    </ng-container>
    `,
    providers: [
        WorkUnitFormService,
    ]
})
export class WorkUnitFormComponent {
    readonly _formService = inject(WorkUnitFormService);
    readonly form = this._formService.form;

    ngOnInit() {
    }

    ngOnDestroy() {
        this.campusLabInfoEditingEnabledSubject.complete();
    }

    readonly workUnit$: Observable<WorkUnit | null> = defer(() => this._formService.committed$.pipe(
        takeUntilDestroyed()
    ));

    readonly campusLabInfoEditingEnabledSubject = new BehaviorSubject<boolean>(false);
    readonly isEditingCampusInfo$: Observable<boolean> = combineLatest([
        this.workUnit$,
        this.campusLabInfoEditingEnabledSubject
    ]).pipe(
        takeUntilDestroyed(),
        map(([workUnit, forceEnabled]) => !workUnit || forceEnabled)
    );


}
