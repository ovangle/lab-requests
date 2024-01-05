import { Campus, campusFromJson, campusParamsFromJson, formatCampus } from "src/app/uni/campus/common/campus";
import { ResourceContainer, ResourceContainerContext, ResourceContainerParams, ResourceContainerPatch, resourceContainerFieldsFromJson, resourceContainerPatchToJson } from "../resource/resource-container";
import { LabType, formatLabType, isLabType } from "../../type/lab-type";
import { formatISO, parseISO } from "date-fns";
import { Observable, defer, filter, firstValueFrom, map, skipWhile } from "rxjs";
import { Inject, Injectable, Optional, Provider, SkipSelf, inject } from "@angular/core";
import { ModelService, RestfulService, modelProviders } from "src/app/common/model/model-service";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanService } from "../../experimental-plan/common/experimental-plan";
import { FileUploadService } from "src/app/common/file/file-upload.service";
import { ModelLookup, ModelMeta, ModelParams, ModelPatch } from "src/app/common/model/model";
import { HttpParams } from "@angular/common/http";
import urlJoin from "url-join";
import { ResourceType } from "../resource/resource-type";
import { ModelContext } from "src/app/common/model/context";
import { ModelCollection, injectModelUpdate } from "src/app/common/model/model-collection";
import { JsonObject } from "src/app/utils/is-json-object";


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

        if (typeof params.index !== 'number') {
            throw new Error('WorkUnit index must be a number')
        }
        this.index = params.index;

        this.campus = params.campus;
        this.labType = params.labType;
        this.technician = params.technician;
        this.processSummary = params.processSummary || '';

        this.startDate = params.startDate || null;
        this.endDate = params.endDate || null;
    }
}

export type WorkUnitFmt = 'campus+lab';

export function formatWorkUnit(workUnit: WorkUnit, format: WorkUnitFmt = 'campus+lab') {
    switch (format) {
        case 'campus+lab':
            return `${formatCampus(workUnit.campus)} - ${formatLabType(workUnit.labType)}`
        default:
            throw new Error('Invalid lab type')
    }
}


export function workUnitParamsFromJson(json: JsonObject): WorkUnitParams {
    const baseParams = resourceContainerFieldsFromJson(json);

    if (typeof json[ 'name' ] !== 'string') {
        throw new Error('Expected a string \'name\'');
    }
    if (typeof json[ 'planId' ] !== 'string') {
        throw new Error('Expected a string \'planId\'');
    }
    if (typeof json[ 'index' ] !== 'number') {
        throw new Error('Expected a number \'index\'');
    }

    if (!isLabType(json[ 'labType' ])) {
        throw new Error('Expected a lab type \'labType\'');
    }

    if (typeof json[ 'technician' ] != 'string') {
        throw new Error('Expected a string \'technician\'')
    }

    if (typeof json[ 'processSummary' ] != 'string') {
        throw new Error('Expected a string \'processSummary\'');
    }

    if (typeof json[ 'startDate' ] !== 'string' && json[ 'startDate' ] != null) {
        throw new Error('Expected either a string or null \'startDate\'');
    }
    const startDate = json[ 'startDate' ] != null ? parseISO(json[ 'startDate' ]) : null;
    if (typeof json[ 'endDate' ] !== 'string' && json[ 'endDate' ] != null) {
        throw new Error('Expected either a string or null \'endDate\'');
    }
    const endDate = json[ 'endDate' ] != null ? parseISO(json[ 'endDate' ]) : null;

    return {
        ...baseParams,
        name: json[ 'name' ],
        planId: json[ 'planId' ],
        index: json[ 'index' ],
        campus: new Campus(campusFromJson(json[ 'campus' ])),
        labType: json[ 'labType' ],
        technician: json[ 'technician' ],
        processSummary: json[ 'processSummary' ],

        startDate,
        endDate
    };
}

export function workUnitFromJson(json: JsonObject): WorkUnit {
    return new WorkUnit(workUnitParamsFromJson(json))
}

export interface WorkUnitPatch extends ResourceContainerPatch<WorkUnit> {
    readonly campus: Campus | string;
    readonly labType: LabType;
    readonly name: string;
    readonly technician: string;

    readonly processSummary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;
}

export function workUnitPatchFromWorkUnit(workUnit: WorkUnit): WorkUnitPatch {
    return {
        name: workUnit.name,
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

export function workUnitPatchToJson(patch: WorkUnitPatch): { [ k: string ]: any } {
    return {
        name: patch.name,
        campus: (patch.campus instanceof Campus) ? patch.campus.id : patch.campus,
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

export interface WorkUnitLookup extends ModelLookup<WorkUnit> { }
export function workUnitLookupToHttpParams(lookup: Partial<WorkUnitLookup>) {
    return new HttpParams();
}

export interface CreateWorkUnitAttachment {
    resourceType: ResourceType | null;
    resourceIndex?: number;
    resourceId?: string;
}

export function createWorkUnitAttachmentToJson(createAttachment: CreateWorkUnitAttachment) {
    const json: { [ k: string ]: any } = {
        resourceType: createAttachment.resourceType
    }
    if (createAttachment.resourceId) {
        json[ 'resourceId' ] = createAttachment.resourceId;
    }
    if (createAttachment.resourceIndex) {
        json[ 'resourceIndex' ] = createAttachment.resourceIndex;
    }
    return json;
}

export class WorkUnitMeta extends ModelMeta<WorkUnit> {

    readonly model = WorkUnit;
    override readonly modelParamsFromJson = workUnitParamsFromJson;
    override readonly modelPatchToJson = workUnitPatchToJson;
    override readonly lookupToHttpParams = workUnitLookupToHttpParams;
}

@Injectable({ providedIn: 'root' })
export class WorkUnitService extends RestfulService<WorkUnit, WorkUnitPatch, WorkUnitLookup> {
    readonly _planModels = inject(ExperimentalPlanService);
    readonly _files = inject(FileUploadService);

    readonly metadata = new WorkUnitMeta();
    override readonly path = '/lab/work-units';
    resourcePathFromPlan(plan: ExperimentalPlan) {
        return urlJoin(this._planModels.path, plan.id, 'work-units');
    }

    resourceAttachmentPath(workUnit: WorkUnit | string) {
        const workUnitId = typeof workUnit === 'string' ? workUnit : workUnit.id;
        return `/lab/work-units/${workUnitId}/files`;
    }

    readById(id: string) {
        return this.fetch(id);
    }

    addAttachment(workUnit: WorkUnit | string, request: CreateWorkUnitAttachment, file: File) {
        return this._files.sendFile(
            this.resourceAttachmentPath(workUnit),
            file,
            createWorkUnitAttachmentToJson(request)
        );
    }
}

@Injectable({ providedIn: 'root' })
export class WorkUnitCollection extends ModelCollection<WorkUnit, WorkUnitPatch, WorkUnitLookup> {
    override readonly service = inject(WorkUnitService);
}


@Injectable()
export class WorkUnitContext extends ModelContext<WorkUnit, WorkUnitPatch> {
    override readonly _doUpdate = injectModelUpdate(
        WorkUnitService,
        WorkUnitCollection
    );
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

    models = inject(WorkUnitService);
    readonly workUnit$ = this.committed$;
}

@Injectable()
export class WorkUnitResourceContainerContext extends ResourceContainerContext<WorkUnit, WorkUnitPatch> {
    readonly _workUnitContext = inject(WorkUnitContext);

    readonly committed$ = this._workUnitContext.committed$;
    override readonly plan$ = this._workUnitContext.plan$;
    override readonly container$ = defer(() => this.committed$);

    constructor() {
        super();
        this.committed$.subscribe(committed => console.log('committed', committed));
        this.container$.subscribe(container => console.log('container 0', container));
    }

    override commitContext(patch: WorkUnitPatch): Promise<WorkUnit> {
        return this._workUnitContext.commit(patch);
    }

    override async patchFromContainerPatch(containerPatch: ResourceContainerPatch<WorkUnit>): Promise<WorkUnitPatch> {
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
        return [ 'work-units', `${workUnit.index || 0}` ];
    }

    override getContainerName(container: WorkUnit) {
        console.log('getting container name', container);
        return formatWorkUnit(container);
    }
}
