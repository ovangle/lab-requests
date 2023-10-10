import { HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional, Provider, SkipSelf, inject } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { formatISO, parseISO } from "date-fns";
import { Observable, filter, firstValueFrom, skipWhile, switchMap, take } from "rxjs";
import { Context } from "src/app/utils/models/model-context";
import { Lookup, ModelService } from "src/app/utils/models/model-service";
import urlJoin from "url-join";
import { Campus, campusFromJson, isCampus } from "../../uni/campus/campus";
import { isDiscipline } from "../../uni/discipline/discipline";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanModelService } from "../experimental-plan/experimental-plan";
import { LabType } from "../type/lab-type";
import { ResourceContainer, ResourceContainerContext, ResourceContainerParams, ResourceContainerPatch, resourceContainerFieldsFromJson, resourceContainerPatchToJson} from "./resource/resource-container";
import { FileUploadService } from "src/app/common/file/file-upload.service";
import { ResourceType } from "./resource/resource-type";


export interface WorkUnitParams extends ResourceContainerParams {
    planId: string;
    id: string;
    index: number;

    campus: Campus;
    labType: LabType;
    technician: string;

    processSummary: string;

    startDate: Date | null;
    endDate: Date | null;
}

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
        params: WorkUnitParams
    ) {
        super(params);
        this.id = params.id!;

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

        ...resourceContainerFieldsFromJson(json)
    })

}

export interface WorkUnitPatch extends ResourceContainerPatch {
    readonly campus: Campus | string;
    readonly labType: LabType;
    readonly technician: string;

    readonly processSummary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;
}

export function workUnitPatchFromWorkUnit(workUnit: WorkUnit): WorkUnitPatch {
    return {
        campus: workUnit.campus,
        labType: workUnit.labType,
        technician: workUnit.technician,
        processSummary: workUnit.processSummary,
        startDate: workUnit.startDate,
        endDate: workUnit.endDate,
        equipments: [],
        softwares: [],
        tasks: [],  
        inputMaterials: [],
        outputMaterials: []
    };
}

export function workUnitPatchToJson(patch: WorkUnitPatch): {[k: string]: any} {
    return {
        campus: isCampus(patch.campus) ? patch.campus.id : patch.campus,
        labType: patch.labType,
        technician: patch.technician,
        processSummary: patch.processSummary,
        startDate: patch.startDate && formatISO(patch.startDate),
        endDate: patch.endDate && formatISO(patch.endDate),
        ...resourceContainerPatchToJson(patch)
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

export interface WorkUnitLookup extends Lookup<WorkUnit> {}
export function workUnitLookupToHttpParams(lookup: Partial<WorkUnitLookup>) {
    return new HttpParams();
}

export interface CreateWorkUnitAttachment {
    resourceType: ResourceType | null;
    resourceIndex?: number;
    resourceId?: string;
}

export function createWorkUnitAttachmentToJson(createAttachment: CreateWorkUnitAttachment) {
    const json: {[k: string]: any} = {
        resourceType: createAttachment.resourceType
    }
    if (createAttachment.resourceId) {
        json['resourceId'] = createAttachment.resourceId;
    }
    if (createAttachment.resourceIndex) {
        json['resourceIndex'] = createAttachment.resourceIndex;
    }
    return json;
}


export class WorkUnitModelService extends ModelService<WorkUnit, WorkUnitPatch, WorkUnitCreate> {
    readonly _planModels = inject(ExperimentalPlanModelService);
    readonly _files = inject(FileUploadService);

    override resourcePath = '/lab/work-units';
    resourcePathFromPlan(plan: ExperimentalPlan) {
        return urlJoin(this._planModels.resourcePath, plan.id, 'work-units');
    }

    resourceAttachmentPath(workUnit: WorkUnit | string) {
        const workUnitId = typeof workUnit === 'string' ? workUnit : workUnit.id;
        return `/lab/work-units/${workUnitId}/files`;
    }

    override readonly modelFromJson = workUnitFromJson;
    override readonly patchToJson = workUnitPatchToJson;
    override readonly createToJson = workUnitCreateToJson;
    override readonly lookupToHttpParams = workUnitLookupToHttpParams;

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

    createForPlan(plan: ExperimentalPlan, request: WorkUnitCreate): Observable<WorkUnit> {
        return this.create(request, {resourcePath: this.resourcePathFromPlan(plan)})
    }

    addAttachment(workUnit: WorkUnit | string, request: CreateWorkUnitAttachment, file: File) {
        return this._files.sendFile(
            this.resourceAttachmentPath(workUnit),
            file,
            createWorkUnitAttachmentToJson(request)
        );
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
    readonly workUnit$ = this.committed$;

    constructor(
        @Optional() 
        @SkipSelf() 
        @Inject(WorkUnitContext)
        parentContext: WorkUnitContext | undefined
    ) {
        super(parentContext)
    }

    override _doCreate(request: WorkUnitCreate): Observable<WorkUnit> {
        return this.plan$.pipe(
            take(1),
            switchMap(plan => this.models.createForPlan(plan, request))
        );
        /*
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
        */
    }

    override _doCommit(id: string, patch: WorkUnitPatch): Observable<WorkUnit> {
        return this.models.update(id, patch);
    }
}

@Injectable()
export class WorkUnitResourceContainerContext extends ResourceContainerContext<WorkUnit, WorkUnitPatch> {
    
    _workUnitContext = inject(WorkUnitContext);
    readonly committed$ = this._workUnitContext.committed$;

    override commitContext(patch: WorkUnitPatch): Promise<WorkUnit> {
        return this._workUnitContext.commit(patch);
    }
    
    override async patchFromContainerPatch(containerPatch: ResourceContainerPatch): Promise<WorkUnitPatch> {
        const workUnit = await firstValueFrom(this._workUnitContext.workUnit$);
        if (workUnit == null) {
            throw new Error('Cannot access resources in empty context');
        }
        return {
            ...workUnitPatchFromWorkUnit(workUnit),
            ...containerPatch
        };
    }

    override async getContainerPath(): Promise<string[]> {
        const workUnit = await firstValueFrom(this.committed$);
        if (workUnit == null) {
            throw new Error('Cannot access resources in empty context');
        }
        return ['work-units', `${workUnit.index || 0}`];
    }
}

export function labWorkUnitModelServiceProviders(): Provider[] {
    return [
        WorkUnitModelService
    ]
}