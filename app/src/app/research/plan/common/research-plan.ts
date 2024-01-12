import { parseISO } from 'date-fns';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelPatch,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchFunding,
  researchFundingFromJsonObject,
} from '../../funding/research-funding';
import { User, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type, inject } from '@angular/core';
import {
  ModelService,
  RestfulService,
} from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';
import { ModelContext } from 'src/app/common/model/context';
import { ResourceContainer, ResourceContainerParams, resourceContainerParamsFromJson } from 'src/app/lab/lab-resource/resource-container';

export interface ResearchPlanTask extends ModelParams {
  readonly id: string;
  readonly index: number;

  readonly startDate: Date | null;
  readonly endDate: Date | null;

  readonly labId: string;
  readonly supervisorId: string;
}

export function researchPlanTaskFromJson(json: JsonObject): ResearchPlanTask {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json[ 'index' ] !== 'number') {
    throw new Error("ResearchPlanTask: 'index' must be an number");
  }

  if (typeof json[ 'startDate' ] !== 'string' && json[ 'startDate' ] !== null) {
    throw new Error("ResearchPlanTask: 'startDate' must be a string or null");
  }
  const startDate = json[ 'startDate' ] ? parseISO(json[ 'startDate' ]) : null;
  if (typeof json[ 'endDate' ] !== 'string' && json[ 'endDate' ] !== null) {
    throw new Error("ResearchPlanTask: 'endDate' must be a string or null");
  }
  const endDate = json[ 'endDate' ] ? parseISO(json[ 'endDate' ]) : null;

  if (typeof json[ 'labId' ] !== 'string') {
    throw new Error("ResearchPlanTask: 'labId' must be a string");
  }
  if (typeof json[ 'supervisorId' ] !== 'string') {
    throw new Error("ResearchPlanTask: 'supervisorId' must be a string");
  }
  return {
    ...baseParams,
    startDate,
    endDate,
    index: json[ 'index' ],
    labId: json[ 'labId' ],
    supervisorId: json[ 'supervisorId' ],
  };
}

export interface ResearchPlanAttachment extends ModelParams {
  readonly id: string;
  readonly path: string;
}

export function researchPlanAttachmentFromJsonObject(json: JsonObject) {
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json[ 'path' ] !== 'string') {
    throw new Error("ResearchPlanAttachment: 'path' must be a string");
  }
  return {
    ...baseParams,
    path: json[ 'path' ],
  };
}

export interface ResearchPlanParams extends ResourceContainerParams {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  readonly funding: ResearchFunding;

  readonly researcher: User;
  readonly coordinator: User;

  readonly tasks: readonly ResearchPlanTask[];
  readonly attachments: readonly ResearchPlanAttachment[];
}

export function researchPlanFromJsonObject(json: JsonObject): ResearchPlan {
  const baseParams = resourceContainerParamsFromJson(json);

  if (typeof json[ 'title' ] !== 'string') {
    throw new Error("ResearchPlanParams: 'title' must be a string");
  }
  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("ResearchPlanParams: 'description' must be a string");
  }
  if (!isJsonObject(json[ 'funding' ])) {
    throw new Error("ResearchPlanParams: 'funding' must be a json object");
  }
  const funding = researchFundingFromJsonObject(json[ 'funding' ]);

  if (!isJsonObject(json[ 'researcher' ])) {
    throw new Error("ResearchPlanParams: 'researcher' must be a json object");
  }
  const researcher = userFromJsonObject(json[ 'researcher' ]);

  if (!isJsonObject(json[ 'coordinator' ])) {
    throw new Error("ResearchPlanParams: 'coordinator' must be a json object");
  }
  const coordinator = userFromJsonObject(json[ 'coordinator' ]);

  if (!Array.isArray(json[ 'tasks' ]) || !json[ 'tasks' ].every(isJsonObject)) {
    throw new Error(
      "ResearchPlanParams: 'tasks' must be an array of json objects",
    );
  }
  const tasks = json[ 'tasks' ].map((o) => researchPlanTaskFromJson(o));

  if (
    !Array.isArray(json[ 'attachments' ]) ||
    !json[ 'attachments' ].every(isJsonObject)
  ) {
    throw new Error(
      "ResearchPlanParams: 'attachments' must be an array of json objects",
    );
  }
  const attachments = json[ 'attachments' ].map((o) =>
    researchPlanAttachmentFromJsonObject(o),
  );

  return new ResearchPlan({
    ...baseParams,
    title: json[ 'title' ],
    description: json[ 'description' ],
    funding,
    researcher,
    coordinator,
    tasks,
    attachments,
  });
}

export class ResearchPlan extends ResourceContainer implements ResearchPlanParams {
  title: string;
  description: string;
  funding: ResearchFunding;
  researcher: User;
  coordinator: User;
  tasks: readonly ResearchPlanTask[];
  attachments: readonly ResearchPlanAttachment[];

  constructor(params: ResearchPlanParams) {
    super(params);
    this.title = params.title;
    this.description = params.description;
    this.funding = params.funding;
    this.researcher = params.researcher;
    this.coordinator = params.coordinator;
    this.tasks = params.tasks;
    this.attachments = params.attachments;
  }
}

export interface ResearchPlanPatch { }

export function researchPlanPatchToJsonObject(
  patch: ResearchPlanPatch,
): JsonObject {
  return {};
}

@Injectable({ providedIn: 'root' })
export class ResearchPlanService extends RestfulService<ResearchPlan> {
  override model = ResearchPlan;
  override modelFromJsonObject = researchPlanFromJsonObject;
  override modelPatchToJsonObject = researchPlanPatchToJsonObject;

  override path = '/research/plan';
}

@Injectable()
export class ResearchPlanCollection extends ModelCollection<ResearchPlan> {
  constructor() {
    super(inject(ResearchPlanService));
  }
}

export function injectResearchPlanService() {
  return injectModelService(ResearchPlanService, ResearchPlanCollection);
}

@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan> {
  readonly service = injectResearchPlanService();
  override _doUpdate(
    id: string,
    patch: ModelPatch<ResearchPlan>,
  ): Promise<ResearchPlan> {
    return firstValueFrom(this.service.update(id, patch));
  }
}
