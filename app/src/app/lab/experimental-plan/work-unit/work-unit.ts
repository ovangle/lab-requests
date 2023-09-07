import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Campus, isCampus } from "../../../uni/campus/campus";
import { Discipline, isDiscipline } from "../../../uni/discipline/discipline";
import { EquipmentLeaseForm, equipmentLeaseForm } from "../resources/equipment/equipment-lease";
import { InputMaterialForm, createInputMaterialForm } from "../resources/material/input/input-material";
import { OutputMaterialForm, createOutputMaterialForm } from "../resources/material/output/output-material";
import { ResourceContainer } from "../resources/resources";
import { SoftwareForm, createSoftwareForm } from "../resources/software/software";
import { LabType } from "../../type/lab-type";
import { Service, ServiceForm } from "../resources/service/service";
import { ResourceContainerPatch } from "../resources/resources";
import { ModelService } from "src/app/utils/models/model-service";
import { ExperimentalPlan, ExperimentalPlanContext, injectExperimentalPlanFromContext } from "../experimental-plan";
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, firstValueFrom, map, of } from "rxjs";
import { Injectable, inject } from "@angular/core";
import { Context } from "src/app/utils/models/model-context";


/**
 * A WorkUnit is a portion of an experimental plan which is conducted
 * at a specific campus at a lab under the control of a specific lab
 * technician.
 */

export class WorkUnit extends ResourceContainer {
    readonly planId: string;
    readonly index: number;
    readonly id: string;

    readonly campus: Campus;
    readonly labType: LabType;
    readonly technician: string;

    readonly summary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;
    constructor(
        params: Partial<WorkUnit>
    ) {
        super(params);
        if (!isCampus(params['campus']))
            throw new Error('WorkUnit lab requires a campus');
        this.campus = params.campus;

        if (!isDiscipline(params.labType))
            throw new Error('WorkUnit lab requires a discipline');
        this.labType = params.labType;

        if (!params.technician)
            throw new Error('WorkUnit requires a technician')
        this.technician = params.technician;

        this.summary = params.summary || '';

        this.startDate = params.startDate || null;
        this.endDate = params.endDate || null;
   }
}

export interface WorkUnitPatch extends ResourceContainerPatch {
    readonly labType: LabType;
    readonly technician: string;

    readonly summary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;
}

export type WorkUnitPatchErrors = ValidationErrors & {
    labType?: {
        required: string | null;
    }; 
    technician?: {
        required: string | null;
        email: string | null;
    };
    startDate?: {
        afterToday: string | null;
    };
    endDate?: {
        afterStartDate: string | null;
    };
}

export interface WorkUnitCreate extends WorkUnitPatch {
    planId: string;
}

export type WorkUnitCreateErrors = WorkUnitPatchErrors & {
    planId?: { 
        required: string | null;
    }
}

export class WorkUnitModelService extends ModelService<WorkUnit, WorkUnitPatch, WorkUnitCreate> {
    override resourcePath = '/lab/experimental-plans/work-units';
    protected resourcePathFromPlan(plan: ExperimentalPlan) {
        return `/lab/experimental-plans/${plan.id}/work-units`;
    }

    override modelFromJson(json: object): WorkUnit {
        return new WorkUnit(json);
    }

    readByPlanAndIndex(plan: ExperimentalPlan, index: number): Observable<WorkUnit> {
        return this.read(`${index}`, { resourcePath: this.resourcePathFromPlan(plan) });
    }

    readById(id: string) {
        return this.read(id);
    }

    queryPlanWorkUnits(plan: ExperimentalPlan, params: {[k: string]: any}): Observable<WorkUnit[]> {
        return this.query(params, {
            resourcePath: this.resourcePathFromPlan(plan)
        });
    }
}

@Injectable()
export abstract class WorkUnitContext extends Context<WorkUnit, WorkUnitPatch> {

    _planContext = inject(Context<ExperimentalPlan>, {skipSelf: true, optional: true});
    readonly plan$: Observable<ExperimentalPlan | null> = (
        this._planContext && this._planContext.committed$ || of(null)
    );

    readonly planIdSubject = new BehaviorSubject<string | null>();

    async create(patch: WorkUnitPatch | WorkUnitCreate): Promise<WorkUnit> {
        const plan = await firstValueFrom(this.plan$);
    }

    models = inject(WorkUnitModelService);
    readonly workUnit$ = this.committedSubject.pipe(
        filter((committed): committed is WorkUnit => committed != null)
    )

    override connect() {
        const _subscription = super.connect();

        return new Subscription(() => {
            _subscription.unsubscribe();
            this.planIdSubject.complete();
        })

    }

}