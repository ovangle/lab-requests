import { ValidationErrors } from "@angular/forms";
import { Campus, isCampus } from "../../../uni/campus/campus";
import { isDiscipline } from "../../../uni/discipline/discipline";
import { ResourceContainer } from "../resources/resource-container";
import { LabType } from "../../type/lab-type";
import { ResourceContainerPatch } from "../resources/resource-container";
import { ModelService } from "src/app/utils/models/model-service";
import { ExperimentalPlan, ExperimentalPlanContext } from "../experimental-plan";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, of } from "rxjs";
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
        return this.fetch(`${index}`, { resourcePath: this.resourcePathFromPlan(plan) });
    }

    readById(id: string) {
        return this.fetch(id);
    }

    queryPlanWorkUnits(plan: ExperimentalPlan, params: {[k: string]: any}): Observable<WorkUnit[]> {
        return this.query(params, {
            resourcePath: this.resourcePathFromPlan(plan)
        });
    }
}

@Injectable()
export abstract class WorkUnitContext extends Context<WorkUnit, WorkUnitPatch> {
    models = inject(WorkUnitModelService);
    _planContext = inject(ExperimentalPlanContext);

    readonly plan$: Observable<ExperimentalPlan> = this._planContext.plan$.pipe(
        filter((plan): plan is ExperimentalPlan => plan != null)
    );

    async create(patch: WorkUnitPatch | WorkUnitCreate): Promise<WorkUnit> {
        const plan = await firstValueFrom(this.plan$);
        return firstValueFrom(this.models.create({...patch, planId: plan.id}));
    }

    readonly workUnit$ = this.committed$;
}