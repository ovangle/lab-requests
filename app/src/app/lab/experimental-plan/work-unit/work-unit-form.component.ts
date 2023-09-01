import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { FormArray, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { ActivatedRoute, ParamMap, Routes } from "@angular/router";
import { BehaviorSubject, Connectable, Observable, Subscription, combineLatest, connectable as createConnectable, distinctUntilChanged, map, tap, withLatestFrom } from "rxjs";
import { EquipmentResourceTableComponent } from "../../resources/equipment/equipment-resource-table.component";
import { InputMaterialResourceTableComponent } from "../../resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "../../resources/material/output/output-material-resource-table.component";
import { ResourceContainer, ResourceContainerFormService } from "../../resources/resources";
import { SoftwareResourceTableComponent } from "../../resources/software/software-resource-table.component";
import { ExperimentalPlanService } from "../experimental-plan";
import { WorkUnit, WorkUnitForm, workUnitForm } from "./work-unit";
import { WorkUnitCampusLabFormComponent } from "./work-unit-campus-lab-form.component";
import { WorkUnitCampusLabInfoComponent } from "./work-unit-campus-lab-info.component";
import { Campus } from "src/app/uni/campus/campus";
import { Equipment } from "../../resources/equipment/equipment";
import { Software } from "../../resources/software/software";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

export function workUnitFormRoutes(): Routes {
    return [
        {
            path: '',
            redirectTo: 'work-units/0',
            pathMatch: 'full'
        },
        {
            path: 'work-units/:work_unit_id',
            component: WorkUnitFormComponent,
            children: [

            ]
        }
    ];
}

export function injectWorkUnitRoute(): ActivatedRoute {
    const activatedRoute = inject(ActivatedRoute);

    const workUnitActivatedRoute = activatedRoute.children.filter(
        child => child.outlet === 'primary'
    )[0]
    if (!workUnitActivatedRoute) {
        throw new Error('No work unit route');
    }
    return workUnitActivatedRoute;
}

@Injectable()
export class WorkUnitFormService {
    readonly planService = inject(ExperimentalPlanService);

    readonly activatedRoute = injectWorkUnitRoute();

    readonly workUnitIndexSubject = new BehaviorSubject(-1);
    readonly workUnitIndex$ = createConnectable(
        combineLatest([
            this.activatedRoute.url,
            this.activatedRoute.paramMap
        ]).pipe(
            tap(([url, _]) => {
                if (!url.some(s => s.path.includes('work-units'))) {
                    throw new Error('Segment must include `work-units` segment');
                }
            }),
            map(([_, params]) => {
                const workUnitIndex = Number.parseInt(params.get('work_unit_id')!);
                if (Number.isNaN(workUnitIndex)) {
                    throw new Error(`Invalid work unit index in route params`)
                }
                return workUnitIndex;
            }),
            withLatestFrom(this.planService.plan$),
            distinctUntilChanged(),
            tap(([workUnitIndex, plan]) => {
                if (workUnitIndex >= plan.workUnits.length) {
                    window.setTimeout(() => this._formArray.push(workUnitForm({})));
                } else {
                    while (plan.workUnits.length < this._formArray.length) {
                        this._formArray.removeAt(this._formArray.length - 1);
                    }
                }
            }),
            map(([workUnitIndex, _]) => workUnitIndex)
        ),
        { connector: () => this.workUnitIndexSubject }
    )

    get workUnitIndex(): number {
        return this.workUnitIndexSubject.value;
    }

    /**
     * The committed work unit.
     */
    readonly workUnit$ =
        combineLatest([
            this.planService.plan$,
            this.workUnitIndex$
        ]).pipe(
            map(([plan, workUnitIndex]) => plan.workUnits[workUnitIndex]),
        )

    get _formArray(): FormArray<WorkUnitForm> {
        return this.planService.form.controls['workUnits'];
    }

    get form(): WorkUnitForm {
        if (this.workUnitIndex < 0) {
            throw new Error('Cannot access work unit form yet');
        }
        return this._formArray.controls[this.workUnitIndex];
    }

    patchWorkUnit(params: Partial<WorkUnit>): void {
        const workUnits = [...this.planService.plan!.workUnits];

        const workUnit: Partial<WorkUnit> = this.workUnitIndex < workUnits.length
            ? workUnits[this.workUnitIndex]
            : {};

        workUnits.splice(
            this.workUnitIndex,
            1,
            new WorkUnit({...workUnit, ...params})
        );
        this.planService.patchExperimentalPlan({ workUnits: workUnits });
    }

    connect(): Subscription {
        return this.workUnitIndex$.connect();
    }

    commitChanges() {
        if (!this.form.valid) {
            throw new Error('Form invalid');
        }
        this.patchWorkUnit(this.form.value as Partial<WorkUnit>);
    }
}

@Injectable()
export class WorkUnitResourceContainerFormService extends ResourceContainerFormService<WorkUnit> {

    readonly workUnitService = inject(WorkUnitFormService);

    protected override getContainer$(): Observable<WorkUnit> {
        return this.workUnitService.workUnit$;
    }

    protected override async patchContainer(params: Partial<ResourceContainer>) {
        return this.workUnitService.patchWorkUnit(params);
    }

    protected override getContainerForm(): WorkUnitForm {
        return this.workUnitService.form;
    }
}

@Component({
    selector: 'lab-req-experimental-plan-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        WorkUnitCampusLabFormComponent,
        WorkUnitCampusLabInfoComponent,

        EquipmentResourceTableComponent,
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
                    <lab-req-equipment-resource-table></lab-req-equipment-resource-table>
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
})
export class WorkUnitFormComponent {
    readonly workUnitService = inject(WorkUnitFormService);
    _workUnitServiceConnection: Subscription | null;

    ngOnInit() {
        this._workUnitServiceConnection = this.workUnitService.connect();
    }

    ngOnDestroy() {
        this._workUnitServiceConnection?.unsubscribe();
        this.campusLabInfoEditingEnabledSubject.complete();
    }

    readonly workUnit$: Observable<WorkUnit | null> = this.workUnitService.workUnit$.pipe(
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
