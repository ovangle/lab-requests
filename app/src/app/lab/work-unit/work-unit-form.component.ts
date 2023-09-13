import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { BehaviorSubject, Observable, combineLatest, defer, map, startWith } from "rxjs";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { WorkUnitBaseInfoFormComponent } from "./base-info/work-unit-base-info-form.component";
import { WorkUnitBaseInfoComponent } from "./base-info/work-unit-base-info.component";
import { WorkUnit } from "./work-unit";
import { WorkUnitFormService } from "./work-unit-form.service";
import { EquipmentLeaseTableComponent } from "./resources/equipment/equipment-lease-table.component";
import { SoftwareResourceTableComponent } from "./resources/software/software-resource-table.component";
import { ServiceResourceTableComponent } from "./resources/service/service-resource-table.component";
import { InputMaterialResourceTableComponent } from "./resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "./resources/material/output/output-material-resource-table.component";

       
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

        EquipmentLeaseTableComponent,
        ServiceResourceTableComponent,
        SoftwareResourceTableComponent,
        InputMaterialResourceTableComponent,
        OutputMaterialResourceTableComponent
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
            <lab-work-unit-base-info-form 
                [form]="form"
                (requestCommit)="_formService.save()">
            </lab-work-unit-base-info-form>
        </ng-container>

        <ng-template #campusDisciplineInfo>
            <lab-work-unit-base-info [workUnit]="(workUnit$ | async)!">
            </lab-work-unit-base-info>
        </ng-template>

        <ng-container *ngIf="workUnit$ | async as workUnit">
            <mat-card>
                <mat-card-content>
                    <lab-equipment-lease-table></lab-equipment-lease-table>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-software-resource-table></lab-software-resource-table>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-input-material-resource-table></lab-input-material-resource-table>
                </mat-card-content>
            </mat-card>

            <mat-card>
                <mat-card-content>
                    <lab-output-material-resource-table></lab-output-material-resource-table>
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
    readonly _formService = inject(WorkUnitFormService);
    readonly form = this._formService.form;

    constructor() {
        this._formService.committed$.subscribe();
    }

    ngOnDestroy() {
        this.campusLabInfoEditingEnabledSubject.complete();
    }

    readonly workUnit$: Observable<WorkUnit | null> = this._formService.committed$.pipe(
        startWith<WorkUnit | null>(null)
    ); 

    readonly campusLabInfoEditingEnabledSubject = new BehaviorSubject<boolean>(false);
    readonly isEditingCampusInfo$: Observable<boolean> = combineLatest([
        this.workUnit$,
        this.campusLabInfoEditingEnabledSubject
    ]).pipe(
        takeUntilDestroyed(),
        map(([workUnit, forceEnabled]) => {
            console.log(`workUnit: ${workUnit} forceEnabled: ${forceEnabled}`)
            return workUnit == null || forceEnabled
        })
    );


}
