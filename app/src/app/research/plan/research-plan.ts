import { parseISO } from 'date-fns';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelQuery,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchFunding,
  ResearchFundingLookup,
  researchFundingFromJsonObject,
} from '../funding/research-funding';
import { User, UserLookup, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type, inject } from '@angular/core';
import {
  ModelService,
  RestfulService,
} from 'src/app/common/model/model-service';
import { Observable, firstValueFrom, map, of, tap } from 'rxjs';

import { ModelContext } from 'src/app/common/model/context';
import { ResourceContainer, ResourceContainerParams, resourceContainerParamsFromJson } from 'src/app/lab/lab-resource/resource-container';
import { ResearchPlanTask, researchPlanTaskFromJson, SpliceResearchPlanTasks } from './task/research-plan-task';
import { UserContext } from 'src/app/user/user-context';
import { HttpParams } from '@angular/common/http';

export interface ResearchPlanAttachment extends ModelParams {
  readonly id: string;
  readonly path: string;
}

export function researchPlanAttachmentFromJsonObject(json: JsonObject) {
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json['path'] !== 'string') {
    throw new Error("ResearchPlanAttachment: 'path' must be a string");
  }
  return {
    ...baseParams,
    path: json['path'],
  };
}

export interface ResearchPlanParams extends ResourceContainerParams, ModelParams {
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
  const baseParams = modelParamsFromJsonObject(json);
  const containerParams = resourceContainerParamsFromJson(json);

  if (typeof json['title'] !== 'string') {
    throw new Error("ResearchPlanParams: 'title' must be a string");
  }
  if (typeof json['description'] !== 'string') {
    throw new Error("ResearchPlanParams: 'description' must be a string");
  }
  if (!isJsonObject(json['funding'])) {
    throw new Error("ResearchPlanParams: 'funding' must be a json object");
  }
  const funding = researchFundingFromJsonObject(json['funding']);

  if (!isJsonObject(json['researcher'])) {
    throw new Error("ResearchPlanParams: 'researcher' must be a json object");
  }
  const researcher = userFromJsonObject(json['researcher']);

  if (!isJsonObject(json['coordinator'])) {
    throw new Error("ResearchPlanParams: 'coordinator' must be a json object");
  }
  const coordinator = userFromJsonObject(json['coordinator']);

  if (!Array.isArray(json['tasks']) || !json['tasks'].every(isJsonObject)) {
    throw new Error(
      "ResearchPlanParams: 'tasks' must be an array of json objects",
    );
  }
  const tasks = json['tasks'].map((o) => researchPlanTaskFromJson(o));

  if (
    !Array.isArray(json['attachments']) ||
    !json['attachments'].every(isJsonObject)
  ) {
    throw new Error(
      "ResearchPlanParams: 'attachments' must be an array of json objects",
    );
  }
  const attachments = json['attachments'].map((o) =>
    researchPlanAttachmentFromJsonObject(o),
  );

  return new ResearchPlan({
    ...baseParams,
    ...containerParams,
    title: json['title'],
    description: json['description'],
    funding,
    researcher,
    coordinator,
    tasks,
    attachments,
  });
}

export class ResearchPlan extends Model implements ResearchPlanParams {
  title: string;
  description: string;
  funding: ResearchFunding;
  researcher: User;
  coordinator: User;
  tasks: readonly ResearchPlanTask[];
  attachments: readonly ResearchPlanAttachment[];

  readonly _container: ResourceContainer;

  constructor(params: ResearchPlanParams) {
    super(params);
    this.title = params.title;
    this.description = params.description;
    this.funding = params.funding;
    this.researcher = params.researcher;
    this.coordinator = params.coordinator;
    this.tasks = params.tasks;
    this.attachments = params.attachments;
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

export interface CreateResearchPlan {
  title: string;
  description: string;
  funding: string | ResearchFundingLookup;
  researcher: string | UserLookup | null;
  coordinator: string | UserLookup | null;
  tasks: SpliceResearchPlanTasks;
}

function createResearchPlanToJsonObject(plan: CreateResearchPlan) {
  return {};
}

export interface ResearchPlanQuery extends ModelQuery<ResearchPlan> {

}

function researchPlanQueryToHttpParams(query: Partial<ResearchPlanQuery>): HttpParams {
  return new HttpParams();
}


@Injectable({ providedIn: 'root' })
export class ResearchPlanService extends RestfulService<ResearchPlan, ResearchPlanQuery, CreateResearchPlan> {
  override readonly modelFromJsonObject = researchPlanFromJsonObject;
  override readonly modelQueryToHttpParams = researchPlanQueryToHttpParams;
  override readonly createRequestToJsonObject = createResearchPlanToJsonObject;
  override readonly updateRequestToJsonObject = undefined;
  override path = '/research/plan';
}

@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan> {
  override readonly service = inject(ResearchPlanService);
}