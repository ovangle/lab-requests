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
  ResearchFundingLookup,
  researchFundingFromJsonObject,
} from '../../funding/research-funding';
import { User, UserLookup, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type, inject } from '@angular/core';
import {
  ModelService,
  RestfulService,
} from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom, map, of, tap } from 'rxjs';
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';
import { ModelContext } from 'src/app/common/model/context';
import { ResourceContainer, ResourceContainerParams, resourceContainerParamsFromJson } from 'src/app/lab/lab-resource/resource-container';
import { ResearchPlanTask, researchPlanTaskFromJson, createResearchPlanTaskToJson, SpliceResearchPlanTasks } from '../task/research-plan-task';
import { UserContext } from 'src/app/user/user-context';
import urlJoin from 'url-join';
import { P } from '@angular/cdk/keycodes';

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

export interface CreateResearchPlan {
  title: string;
  description: string;
  funding: string | ResearchFundingLookup;
  researcher: string | UserLookup | null;
  coordinator: string | UserLookup | null;
  tasks: SpliceResearchPlanTasks;
}


@Injectable({ providedIn: 'root' })
export class ResearchPlanService extends RestfulService<ResearchPlan> {
  override model = ResearchPlan;
  override modelFromJsonObject = researchPlanFromJsonObject;

  override path = '/research/plan';
}

@Injectable({ providedIn: 'root' })
export class ResearchPlanCollection extends ModelCollection<ResearchPlan, ResearchPlanService> implements ResearchPlanService {
  readonly _userContext = inject(UserContext);

  constructor(service: ResearchPlanService) {
    super(service);

    this._userContext.user.subscribe(user => {
      if (user) {
        user.plans.items.forEach(plan => this._cache.set(plan.id, plan))
      }
    })
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

