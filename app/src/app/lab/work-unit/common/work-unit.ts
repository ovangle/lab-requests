import {
  Campus,
  campusFromJsonObject,
  formatCampus,
} from 'src/app/uni/campus/campus';
import { validate as validateIsUUID } from 'uuid';
import { formatISO, parseISO } from 'date-fns';
import {
  Observable,
  filter,
  firstValueFrom,
  skipWhile,
} from 'rxjs';
import {
  Injectable, inject,
} from '@angular/core';
import { RestfulService } from 'src/app/common/model/model-service';

import { FileUploadService } from 'src/app/common/file/file-upload.service';

import urlJoin from 'url-join';
import { ModelContext, RelatedModelService } from 'src/app/common/model/context';

import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchPlan,
  ResearchPlanContext,
  ResearchPlanService,
} from 'src/app/research/plan/research-plan';
import {
  ResourceContainer,
  ResourceContainerParams,
  ResourceContainerPatch,
  resourceContainerParamsFromJson,
  resourceContainerPatchToJson,
} from '../../lab-resource/resource-container';
import { ResourceType } from '../../lab-resource/resource-type';
import { StoredFile } from 'src/app/common/file/stored-file';
import { Discipline, formatDiscipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { Model, ModelParams, ModelQuery, modelParamsFromJsonObject } from 'src/app/common/model/model';
import { LabContext } from '../../lab-context';
import { Lab } from '../../lab';
import { HttpParams } from '@angular/common/http';

export interface WorkUnitParams extends ResourceContainerParams, ModelParams {
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

export class WorkUnit extends Model implements WorkUnitParams {
  readonly planId: string;
  readonly name: string;

  readonly campus: Campus;
  readonly labId: string;
  readonly discipline: Discipline;
  readonly supervisorId: string;

  readonly processSummary: string;

  readonly startDate: Date | null;
  readonly endDate: Date | null;

  readonly _container: ResourceContainer;

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
    this._container = new ResourceContainer(params);
  }

  get equipments() {
    return this._container.equipments;
  }
  get softwares() {
    return this._container.softwares;
  }
  get inputMaterials() {
    return this._container.inputMaterials;
  }
  get outputMaterials() {
    return this._container.outputMaterials;
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
  const baseParams = modelParamsFromJsonObject(json);
  const containerParams = resourceContainerParamsFromJson(json);
  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json['planId'] !== 'string') {
    throw new Error("Expected a string 'planId'");
  }
  if (typeof json['index'] !== 'number') {
    throw new Error("Expected a number 'index'");
  }

  if (typeof json['labId'] !== 'string' || !validateIsUUID(json['labId'])) {
    throw new Error("Expected a UUID 'labType'");
  }

  if (typeof json['supervisorId'] !== 'string' || !validateIsUUID(json['supervisorId'])) {
    throw new Error("Expected a UUID 'supervisorId'");
  }

  if (!isDiscipline(json['discipline'])) {
    throw new Error("Expected a Discipline 'discipline'");
  }


  if (typeof json['processSummary'] != 'string') {
    throw new Error("Expected a string 'processSummary'");
  }

  if (typeof json['startDate'] !== 'string' && json['startDate'] != null) {
    throw new Error("Expected either a string or null 'startDate'");
  }
  const startDate =
    json['startDate'] != null ? parseISO(json['startDate']) : null;
  if (typeof json['endDate'] !== 'string' && json['endDate'] != null) {
    throw new Error("Expected either a string or null 'endDate'");
  }
  const endDate = json['endDate'] != null ? parseISO(json['endDate']) : null;

  if (!isJsonObject(json['campus'])) {
    throw new Error("Expected a json object 'campus'");
  }

  return new WorkUnit({
    ...baseParams,
    ...containerParams,
    name: json['name'],
    planId: json['planId'],
    labId: json['labId'],
    supervisorId: json['supervisorId'],
    campus: campusFromJsonObject(json['campus']),
    discipline: json['discipline'],
    processSummary: json['processSummary'],

    startDate,
    endDate,
  });
}

export interface WorkUnitQuery extends ModelQuery<WorkUnit> { }
function workUnitQueryToHttpParams(query: WorkUnitQuery) {
  return new HttpParams();
}

@Injectable()
export class WorkUnitService extends RelatedModelService<Lab, WorkUnit> {
  readonly context = inject(LabContext);
  readonly _planModels = inject(ResearchPlanService);

  readonly _files = inject(FileUploadService);
  override readonly modelFromJsonObject = workUnitFromJsonObject;
  override readonly modelQueryToHttpParams = workUnitQueryToHttpParams;
  override readonly path = 'work-units';
}

@Injectable()
export class WorkUnitContext extends ModelContext<WorkUnit> {
  readonly service = inject(WorkUnitService);

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

  readonly workUnit$ = this.committed$;
}
