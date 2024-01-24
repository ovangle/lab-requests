import {
  Campus,
  campusFromJsonObject,
  formatCampus,
} from 'src/app/uni/campus/campus';
import { validate as validateIsUUID } from 'uuid';
import { formatISO, parseISO } from 'date-fns';
import {
  Observable,
  defer,
  filter,
  firstValueFrom,
  map,
  skipWhile,
} from 'rxjs';
import {
  Inject,
  Injectable,
  Optional,
  Provider,
  SkipSelf,
  inject,
} from '@angular/core';
import { RestfulService } from 'src/app/common/model/model-service';

import { FileUploadService } from 'src/app/common/file/file-upload.service';

import { HttpParams } from '@angular/common/http';
import urlJoin from 'url-join';
import { ModelContext } from 'src/app/common/model/context';
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchPlan,
  ResearchPlanContext,
  ResearchPlanService,
  injectResearchPlanService,
} from 'src/app/research/plan/research-plan';
import {
  ResourceContainer,
  ResourceContainerContext,
  ResourceContainerParams,
  ResourceContainerPatch,
  resourceContainerParamsFromJson,
  resourceContainerPatchToJson,
} from '../../lab-resource/resource-container';
import { ResourceType } from '../../lab-resource/resource-type';
import { StoredFile } from 'src/app/common/file/stored-file';
import { Discipline, formatDiscipline, isDiscipline } from 'src/app/uni/discipline/discipline';

export interface WorkUnitParams extends ResourceContainerParams {
  planId: string;
  id: string;
  name: string;

  campus: Campus;
  labId: string;
  discipline: Discipline;
  supervisorId: string;

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
  readonly name: string;

  readonly campus: Campus;
  readonly labId: string;
  readonly discipline: Discipline;
  readonly supervisorId: string;

  readonly processSummary: string;

  readonly startDate: Date | null;
  readonly endDate: Date | null;

  constructor(params: WorkUnitParams) {
    super(params);

    this.planId = params.planId;
    this.name = params.name;
    this.campus = params.campus;
    this.labId = params.labId;
    this.discipline = params.discipline;
    this.supervisorId = params.supervisorId;
    this.processSummary = params.processSummary || '';

    this.startDate = params.startDate || null;
    this.endDate = params.endDate || null;
  }
}

export type WorkUnitFmt = 'campus+lab';

export function formatWorkUnit(
  workUnit: WorkUnit,
  format: WorkUnitFmt = 'campus+lab',
) {
  switch (format) {
    case 'campus+lab':
      return `${formatCampus(workUnit.campus)} - ${formatDiscipline(workUnit.discipline)}`;
    default:
      throw new Error('Invalid lab type');
  }
}

export function workUnitFromJsonObject(json: JsonObject): WorkUnit {
  const baseParams = resourceContainerParamsFromJson(json);
  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json[ 'planId' ] !== 'string') {
    throw new Error("Expected a string 'planId'");
  }
  if (typeof json[ 'index' ] !== 'number') {
    throw new Error("Expected a number 'index'");
  }

  if (typeof json[ 'labId' ] !== 'string' || !validateIsUUID(json[ 'labId' ])) {
    throw new Error("Expected a UUID 'labType'");
  }

  if (typeof json[ 'supervisorId' ] !== 'string' || !validateIsUUID(json[ 'supervisorId' ])) {
    throw new Error("Expected a UUID 'supervisorId'");
  }

  if (!isDiscipline(json[ 'discipline' ])) {
    throw new Error("Expected a Discipline 'discipline'");
  }


  if (typeof json[ 'processSummary' ] != 'string') {
    throw new Error("Expected a string 'processSummary'");
  }

  if (typeof json[ 'startDate' ] !== 'string' && json[ 'startDate' ] != null) {
    throw new Error("Expected either a string or null 'startDate'");
  }
  const startDate =
    json[ 'startDate' ] != null ? parseISO(json[ 'startDate' ]) : null;
  if (typeof json[ 'endDate' ] !== 'string' && json[ 'endDate' ] != null) {
    throw new Error("Expected either a string or null 'endDate'");
  }
  const endDate = json[ 'endDate' ] != null ? parseISO(json[ 'endDate' ]) : null;

  if (!isJsonObject(json[ 'campus' ])) {
    throw new Error("Expected a json object 'campus'");
  }

  return new WorkUnit({
    ...baseParams,
    name: json[ 'name' ],
    planId: json[ 'planId' ],
    labId: json[ 'labId' ],
    supervisorId: json[ 'supervisorId' ],
    campus: campusFromJsonObject(json[ 'campus' ]),
    discipline: json[ 'discipline' ],
    processSummary: json[ 'processSummary' ],

    startDate,
    endDate,
  });
}

export interface WorkUnitPatch extends ResourceContainerPatch {
  readonly planId?: string;
  readonly campus: Campus | string;
  readonly discipline: Discipline;
  readonly name: string;
  readonly technician: string;

  readonly processSummary: string;

  readonly startDate: Date | null;
  readonly endDate: Date | null;
}


export function workUnitPatchToJsonObject(patch: WorkUnitPatch): {
  [ k: string ]: any;
} {
  let base: JsonObject = {};
  if (patch.planId) {
    base[ 'planId' ] = patch.planId;
  }

  return {
    ...base,
    name: patch.name,
    campus: patch.campus instanceof Campus ? patch.campus.id : patch.campus,
    discipline: patch.discipline,
    technician: patch.technician,
    processSummary: patch.processSummary,
    startDate: patch.startDate && formatISO(patch.startDate),
    endDate: patch.endDate && formatISO(patch.endDate),
    ...resourceContainerPatchToJson(patch),
  };
}

export interface CreateWorkUnitAttachment {
  resourceType: ResourceType | null;
  resourceIndex?: number;
  resourceId?: string;
}

export function createWorkUnitAttachmentToJson(
  createAttachment: CreateWorkUnitAttachment,
) {
  const json: { [ k: string ]: any } = {
    resourceType: createAttachment.resourceType,
  };
  if (createAttachment.resourceId) {
    json[ 'resourceId' ] = createAttachment.resourceId;
  }
  if (createAttachment.resourceIndex) {
    json[ 'resourceIndex' ] = createAttachment.resourceIndex;
  }
  return json;
}

@Injectable({ providedIn: 'root' })
export class WorkUnitService extends RestfulService<WorkUnit> {
  readonly _planModels = inject(ResearchPlanService);
  readonly _files = inject(FileUploadService);

  override readonly model = WorkUnit;
  override readonly modelFromJsonObject = workUnitFromJsonObject;
  override path = '/lab/work-units';

  resourcePathFromPlan(plan: ResearchPlan) {
    return urlJoin(this._planModels.path, plan.id, 'work-units');
  }

  resourceAttachmentPath(workUnit: WorkUnit | string) {
    const workUnitId = typeof workUnit === 'string' ? workUnit : workUnit.id;
    return `/ lab / work - units / ${workUnitId} /files`;
  }

  readById(id: string) {
    return this.fetch(id);
  }

  addAttachment(
    workUnit: WorkUnit | string,
    request: CreateWorkUnitAttachment,
    file: File,
  ) {
    return this._files.sendFile(
      this.resourceAttachmentPath(workUnit),
      file,
      createWorkUnitAttachmentToJson(request),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class WorkUnitCollection extends ModelCollection<WorkUnit, WorkUnitService> implements WorkUnitService {
  readonly _planModels = injectResearchPlanService();
  readonly _files = inject(FileUploadService);

  constructor(service: WorkUnitService) {
    super(service);
  }
  resourcePathFromPlan(plan: ResearchPlan): string {
    return this.service.resourcePathFromPlan(plan);
  }
  resourceAttachmentPath(workUnit: string | WorkUnit): string {
    return this.service.resourceAttachmentPath(workUnit);
  }
  readById(id: string): Observable<WorkUnit> {
    return this.readById(id).pipe(
      this._cacheResult
    );
  }
  addAttachment(workUnit: string | WorkUnit, request: CreateWorkUnitAttachment, file: File): Observable<StoredFile> {
    return this.service.addAttachment(workUnit, request, file);
  }
}

@Injectable()
export class WorkUnitContext extends ModelContext<WorkUnit, WorkUnitPatch> {
  readonly service = injectWorkUnitService();
  override _doUpdate(id: string, patch: WorkUnitPatch): Promise<WorkUnit> {
    return firstValueFrom(this.service.update(id, patch));
  }

  _planContext = inject(ResearchPlanContext);
  readonly plan$ = this._planContext.committed$.pipe(
    skipWhile((p) => p == null), // Ignore initial nulls
    filter((p): p is ResearchPlan => {
      if (p == null) {
        throw new Error(
          'WorkUnit context requires an non-null experimental plan context',
        );
      }
      return true;
    }),
  );

  models = inject(WorkUnitService);
  readonly workUnit$ = this.committed$;
}

@Injectable()
export class WorkUnitResourceContainerContext extends ResourceContainerContext<
  WorkUnit,
  WorkUnitPatch
> {
  readonly _workUnitContext = inject(WorkUnitContext);

  readonly committed$ = this._workUnitContext.committed$;
  override readonly plan$ = this._workUnitContext.plan$;
  override readonly container$ = defer(() => this.committed$);

  constructor() {
    super();
    this.committed$.subscribe((committed) =>
      console.log('committed', committed),
    );
    this.container$.subscribe((container) =>
      console.log('container 0', container),
    );
  }

  override commitContext(patch: WorkUnitPatch): Promise<WorkUnit> {
    return this._workUnitContext.commit(patch);
  }

  override async patchFromContainerPatch(
    containerPatch: ResourceContainerPatch,
  ): Promise<WorkUnitPatch> {
    const workUnit = await firstValueFrom(this._workUnitContext.workUnit$);
    if (workUnit == null) {
      throw new Error('Cannot access resources in empty context');
    }
    throw new Error('not implemented');
  }

  override async getContainerPath(): Promise<string[]> {
    const workUnit = await firstValueFrom(this.committed$);
    if (workUnit == null) {
      throw new Error('Cannot access resources in empty context');
    }
    return [ 'work-units', `${workUnit.name || 0}` ];
  }

  override getContainerName(container: WorkUnit) {
    console.log('getting container name', container);
    return formatWorkUnit(container);
  }
}

export function injectWorkUnitService() {
  return injectModelService(WorkUnitService, WorkUnitCollection);
}
