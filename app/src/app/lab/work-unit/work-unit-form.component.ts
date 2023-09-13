import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { BehaviorSubject, Observable, combineLatest, defer, map } from "rxjs";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { Campus } from "src/app/uni/campus/campus";
import { WorkUnitBaseInfoFormComponent } from "./base-info/work-unit-base-info-form.component";
import { WorkUnitBaseInfoComponent } from "./base-info/work-unit-base-info.component";
import { hazardClassFromDivision } from "./resources/common/hazardous/hazardous";
import { InputMaterial } from "./resources/material/input/input-material";
import { Software } from "./resources/software/software";
import { WorkUnit } from "./work-unit";
import { WorkUnitFormService } from "./work-unit-form.service";

const workUnitFixture = new WorkUnit({
    campus: new Campus({code: 'ROK', name: 'Rockhampton'} as any),
    labType: 'ICT',
    technician: 'hello@world.com',
    softwares: [
        new Software({ name: 'MATLAB', description: 'test', minVersion: '3.21' }),
        new Software({ name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304' })
    ],
    inputMaterials: [
        new InputMaterial({
            name: 'poison',
            baseUnit: 'L',
            hazardClasses: [
                hazardClassFromDivision('1.4'),
                hazardClassFromDivision('6')
            ]
        })
    ]
})
       
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
    readonly _formService = inject(WorkUnitFormService);
    readonly form = this._formService.form;

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
