import {
  Model,
  ModelParams,
  ModelQuery,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResearchFunding,
  researchFundingFromJsonObject,
} from '../funding/research-funding';
import { User, UserLookup, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type, inject } from '@angular/core';
import {
  RestfulService,
} from 'src/app/common/model/model-service';

import { ModelContext } from 'src/app/common/model/context';
import { CreateResearchPlanTask, ResearchPlanTask, ResearchPlanTaskParams, ResearchPlanTaskSlice, researchPlanTaskFromJson, researchPlanTaskSliceToJson } from './task/research-plan-task';
import { HttpParams } from '@angular/common/http';
import { Lab, LabService, labFromJsonObject } from 'src/app/lab/lab';
import { Observable, first, firstValueFrom, switchMap } from 'rxjs';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { ResourceConsumerParams, resourceContainerParamsFromJson, LabResourceConsumer, LabResourceConsumerPatch, resourceConsumerPatchToJsonObject } from 'src/app/lab/lab-resource-consumer/resource-container';
import { Resource, ResourcePatch } from 'src/app/lab/lab-resource/resource';
import { ResourceType } from 'src/app/lab/lab-resource/resource-type';
import urlJoin from 'url-join';

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

export interface ResearchPlanParams extends ResourceConsumerParams, ModelParams {
  readonly id: string;

  readonly discipline: Discipline;
  readonly title: string;
  readonly description: string;

  readonly funding: ResearchFunding;

  readonly researcher: User;
  readonly coordinator: User;
  readonly lab: Lab | string;

  readonly tasks: readonly ResearchPlanTask[];
  readonly attachments: readonly ResearchPlanAttachment[];
}

export function researchPlanFromJsonObject(json: JsonObject): ResearchPlan {
  const containerParams = resourceContainerParamsFromJson(json);

  if (!isDiscipline(json[ 'discipline' ])) {
    throw new Error("Expected a discipline 'discipline'");
  }

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

  let lab: Lab | string;
  if (isJsonObject(json[ 'lab' ])) {
    lab = labFromJsonObject(json[ 'lab' ]);
  } else if (typeof json[ 'lab' ] === 'string') {
    lab = json[ 'lab' ]
  } else {
    throw new Error("Expected a json object or string 'lab'");
  }

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
    ...containerParams,
    title: json[ 'title' ],
    discipline: json[ 'discipline' ],
    description: json[ 'description' ],
    funding,
    researcher,
    coordinator,
    lab,
    tasks,
    attachments,
  });
}

export class ResearchPlan extends LabResourceConsumer implements ResearchPlanParams {
  discipline: Discipline;
  title: string;
  description: string;
  funding: ResearchFunding;
  researcher: User;
  coordinator: User;

  lab: Lab | string;
  tasks: readonly ResearchPlanTask[];
  attachments: readonly ResearchPlanAttachment[];

  constructor(params: ResearchPlanParams) {
    super(params);
    this.discipline = params.discipline;
    this.title = params.title;
    this.description = params.description;
    this.funding = params.funding;
    this.researcher = params.researcher;
    this.coordinator = params.coordinator;
    this.lab = params.lab;
    this.tasks = params.tasks;
    this.attachments = params.attachments;
  }
}

export interface CreateResearchPlan {
  title: string;
  description: string;
  funding: string | null;
  researcher: string;
  coordinator: string;
  tasks: CreateResearchPlanTask[];
}

function createResearchPlanToJsonObject(plan: CreateResearchPlan) {
  return { ...plan };
}

export interface UpdateResearchPlan extends LabResourceConsumerPatch {
  title: string;
  description: string;
  funding: ResearchFunding | null;
  tasks?: ResearchPlanTaskSlice[];
}

function updateResearchPlanToJsonObject(plan: ResearchPlan, patch: Partial<UpdateResearchPlan>) {
  let funding: ResearchFunding | null
  if (patch.funding instanceof ResearchFunding || patch.funding === null) {
    funding = patch.funding;
  } else {
    funding = plan.funding;
  }

  const resourceConsumerAttrs = resourceConsumerPatchToJsonObject(plan, patch)

  return {
    title: typeof patch.title === 'string' ? patch.title : plan.title,
    description: typeof patch.description === 'string' ? patch.description : plan.description,
    funding: funding?.id,
    tasks: Array.isArray(patch.tasks) ? patch.tasks.map(t => researchPlanTaskSliceToJson(t)) : [],
    ...resourceConsumerAttrs
  };
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
  override readonly createToJsonObject = createResearchPlanToJsonObject;
  override readonly updateToJsonObject = updateResearchPlanToJsonObject;
  override path = '/research/plans';

  _alterTasks(task: ResearchPlanTask, slices: ResearchPlanTaskSlice[]) {
    return this.fetch(task.planId).pipe(
      switchMap(plan => this.update(plan, {
        title: plan.title,
        description: plan.description,
        tasks: slices
      }))
    );
  }

  updateTask(task: ResearchPlanTask, request: CreateResearchPlanTask) {
    const slice: ResearchPlanTaskSlice = {
      startIndex: task.index,
      endIndex: task.index + 1,
      items: [
        request
      ]
    };
    return this._alterTasks(task, [ slice ]);
  }

  removeTask(task: ResearchPlanTask) {
    const slice: ResearchPlanTaskSlice = {
      startIndex: task.index,
      endIndex: task.index + 1,
      items: []
    };
    return this._alterTasks(task, [ slice ]);
  }

  _resourceIndexUrl$(plan: ResearchPlan, resourceType: string) {
    return this.modelUrl(plan).pipe(
      first(),
      switchMap(modelUrl => urlJoin(modelUrl, resourceType) + '/')
    )
  }
}
