import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { ActivatedRoute, ParamMap, Routes } from "@angular/router";
import { BehaviorSubject, Connectable, Observable, Subscription, combineLatest, connectable as createConnectable, distinctUntilChanged, firstValueFrom, map, of, tap, withLatestFrom } from "rxjs";

import { WorkUnitBaseInfoComponent } from "./base-info/work-unit-base-info.component";
import { WorkUnitBaseInfoFormComponent } from "./base-info/work-unit-base-info-form.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { WorkUnit, WorkUnitContext, WorkUnitModelService, WorkUnitPatch, WorkUnitPatchErrors } from "./work-unit";
import { Campus } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { LabType } from "../type/lab-type";
import { EquipmentLeaseTableComponent } from "./resources/equipment/equipment-lease-table.component";
import { InputMaterialResourceTableComponent } from "./resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "./resources/material/output/output-material-resource-table.component";
import { ResourceContainerFormControls, resourceContainerFormControls } from "./resources/resource-container-form";
import { SoftwareResourceTableComponent } from "./resources/software/software-resource-table.component";

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    summary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

} & ResourceContainerFormControls>;

@Injectable()
export class WorkUnitFormService {
    readonly models = inject(WorkUnitModelService);
    readonly context: WorkUnitContext = inject(WorkUnitContext);

    readonly form = new FormGroup({
        campus: new FormControl<Campus | null>(null, {validators: [Validators.required]}),
        labType: new FormControl<LabType | null>(null, {validators: [Validators.required]}),
        technician: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email
            ]
        }),
        summary: new FormControl('', {nonNullable: true}),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        ...resourceContainerFormControls()
    });

    readonly committed$ = this.context.committed$;

    readonly patch$: Observable<WorkUnitPatch | null> = this.form.statusChanges.pipe(
        map((status) => status === 'VALID' ? this.form.value as WorkUnitPatch : null)
    );

    readonly formErrors$: Observable<WorkUnitPatchErrors | null> = this.form.statusChanges.pipe(
        map((status) => status === 'INVALID' ? this.form.errors as WorkUnitPatchErrors : null)
    )

    async commit() {
        if (this.form.invalid) {
            throw new Error('Cannot patch: invalid form');
        }
        const patch = await firstValueFrom(this.patch$);
        return await this.context.commit(patch!);
    }
}


// @Injectable()
// export class WorkUnitResourceContainerFormService extends ResourceContainerFormService<WorkUnit> {

//     readonly workUnitService = inject(WorkUnitPatchFormService);

//     protected override getContainer$(): Observable<WorkUnit> {
//         return this.workUnitService.workUnit$;
//     }

//     protected override async patchContainer(params: Partial<ResourceContainer>) {
//         return this.workUnitService.patchWorkUnit(params);
//     }

//     protected override getContainerForm(): WorkUnitForm {
//         return this.workUnitService.form;
//     }
// }

@Component({
    selector: 'lab-req-experimental-plan-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        WorkUnitFormComponent,
        WorkUnitBaseInfoComponent,

        EquipmentLeaseTableComponent,
        SoftwareResourceTableComponent,
        InputMaterialResourceTableComponent,
        OutputMaterialResourceTableComponent
    ],
    template: `
    <ng-container *ngIf="workUnitService.form" [formGroup]="workUnitService.form">
        <!--
            the work unit data capture process is in two steps.
            First, the campus, lab type and technician are selected using the work-unit-campus-lab-form
            Then the resources and all other info are captured using the remainder of the form.
            If there is a work unit in the committed experimental plan workUnits corresponding to this
            form, then display a read-only version of the previously captured info
        -->
        <ng-container *ngIf="isEditingCampusInfo$ | async; else campusDisciplineInfo">
            <lab-req-work-unit-campus-lab-form>
            </lab-req-work-unit-campus-lab-form>
        </ng-container>

        <ng-template #campusDisciplineInfo>
            <lab-req-work-unit-campus-lab-info [workUnit]="(workUnit$ | async)!">
            </lab-req-work-unit-campus-lab-info>
        </ng-template>

        <ng-container *ngIf="workUnit$ | async as workUnit">
            <mat-form-field>
                <mat-label>Process summary</mat-label>
                <textarea matInput formControlName="summary">
                </textarea>
            </mat-form-field>

            <mat-card>
                <mat-card-content>
                    <lab-req-equipment-lease-table></lab-req-equipment-lease-table>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-req-software-resource-table></lab-req-software-resource-table>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-req-input-material-resource-table></lab-req-input-material-resource-table>

                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-req-output-material-resource-table></lab-req-output-material-resource-table>
                </mat-card-content>
            </mat-card>
        </ng-container>
    </ng-container>
    `,
    providers: [
        WorkUnitFormService,
    ]
})
export class WorkUnitFormComponent {
    readonly workUnitService = inject(WorkUnitFormService);

    ngOnInit() {
    }

    ngOnDestroy() {
        this.campusLabInfoEditingEnabledSubject.complete();
    }

    readonly workUnit$: Observable<WorkUnit | null> = this.workUnitService.committed$.pipe(
        takeUntilDestroyed()
    );

    readonly campusLabInfoEditingEnabledSubject = new BehaviorSubject<boolean>(false);
    readonly isEditingCampusInfo$: Observable<boolean> = combineLatest([
        this.workUnit$,
        this.campusLabInfoEditingEnabledSubject
    ]).pipe(
        takeUntilDestroyed(),
        map(([workUnit, forceEnabled]) => !workUnit || forceEnabled)
    );


}
