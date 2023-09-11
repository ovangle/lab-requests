import { ValidationErrors } from "@angular/forms";
import { Campus, CampusCode, campusFromJson, isCampus } from "../../uni/campus/campus";
import { isDiscipline } from "../../uni/discipline/discipline";
import { ResourceContainer, ResourceContainerContext, researchContainerFieldsFromJson } from "./resources/resource-container";
import { LabType } from "../type/lab-type";
import { ResourceContainerPatch } from "./resources/resource-container";
import { ModelService } from "src/app/utils/models/model-service";
import { ExperimentalPlan, ExperimentalPlanContext } from "../experimental-plan/experimental-plan";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, of, skipWhile, switchMap, take } from "rxjs";
import { Injectable, inject } from "@angular/core";
import { Context } from "src/app/utils/models/model-context";
import { formatISO, parseISO } from "date-fns";


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

    readonly processSummary: string;

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

        this.processSummary = params.processSummary || '';

        this.startDate = params.startDate || null;
        this.endDate = params.endDate || null;
   }
}


export function workUnitFromJson(json: {[k: string]: any}): WorkUnit {
    return new WorkUnit({
        id: json['id'],
        planId: json['planId'],
        index: json['index'],
        campus: campusFromJson(json['campus']),
        labType: json['labType'],
        technician: json['technician'],
        processSummary: json['processSummary'],

        startDate: json['startDate'] && parseISO(json['startDate']),
        endDate: json['endDate'] && parseISO(json['endDate']),

        ...researchContainerFieldsFromJson(json)
    })

}

export interface WorkUnitPatch extends ResourceContainerPatch {
    readonly labType: LabType;
    readonly technician: string;

    readonly summary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;
}

export function workUnitPatchToJson(patch: WorkUnitPatch): {[k: string]: any} {
    return {
        labType: patch.labType,
        technician: patch.technician,
        summary: patch.summary,
        startDate: patch.startDate && formatISO(patch.startDate),
        endDate: patch.endDate && formatISO(patch.endDate)
    };
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

export function isWorkUnitCreate(obj: any): obj is WorkUnitCreate {
    return typeof obj === 'object' && !!obj && typeof obj.planId === 'string';
}

export function workUnitCreateToJson(create: WorkUnitCreate) {
    return {
        ...workUnitPatchToJson(create),
        planId: create.planId
    };
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

    override readonly modelFromJson = workUnitFromJson;
    override readonly patchToJson = workUnitPatchToJson;
    override readonly createToJson = workUnitCreateToJson;

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
export class WorkUnitContext extends Context<WorkUnit, WorkUnitPatch> {
    _planContext = inject(ExperimentalPlanContext);
    readonly plan$ = this._planContext.committed$.pipe(
        skipWhile((p) => p == null), // Ignore initial nulls
        filter((p): p is ExperimentalPlan => {
            if (p == null) {
                throw new Error('WorkUnit context requires an non-null experimental plan context');
            }
            return true;
        })
    );

    models: WorkUnitModelService = inject(WorkUnitModelService);
    readonly workUnit$ = this.committedSubject.pipe(
        filter((committed): committed is WorkUnit => committed != null)
    )

    override _doCreate(request: WorkUnitCreate): Observable<WorkUnit> {
        return this.plan$.pipe(
            take(1),
            switchMap(contextPlan => {
                if (request.planId && request.planId != contextPlan.id) {
                    throw new Error('Cannot create work unit for different plan');
                }
                request.planId = contextPlan.id;
                return this.models.create(request);
            })
        )
    }

    override _doCommit(id: string, patch: WorkUnitPatch): Observable<WorkUnit> {
        return this.models.update(id, patch);
    }
}

@Injectable()
export class WorkUnitResourceContainerContext extends ResourceContainerContext<WorkUnit, WorkUnitPatch> {
    readonly workUnitContext = inject(WorkUnitContext);
    override committed$ = this.workUnitContext.committed$;

    override commitContext(patch: WorkUnitPatch): Promise<WorkUnit> {
        return this.workUnitContext.commit(patch);
    };

    override patchFromContainerPatch(containerPatch: ResourceContainerPatch): WorkUnitPatch {
        return containerPatch as WorkUnitPatch; 
    }
}