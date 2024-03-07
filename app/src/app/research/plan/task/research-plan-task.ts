import { Injectable, Type, inject } from "@angular/core";
import { Model, ModelIndexPage, ModelParams, ModelQuery, modelParamsFromJsonObject } from "src/app/common/model/model";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ResearchPlan } from "../research-plan";
import { HttpParams } from "@angular/common/http";
import { Observable, firstValueFrom, map } from "rxjs";
import { format, formatISO, parseISO } from "date-fns";
import { RelatedModelService } from "src/app/common/model/context";
import { ResearchPlanContext } from "../research-plan-context";
import { Lab, LabService, labFromJsonObject } from "src/app/lab/lab";
import { User, UserService, userFromJsonObject } from "src/app/user/common/user";
import { ThisReceiver } from "@angular/compiler";
import { P } from "@angular/cdk/keycodes";


export interface ResearchPlanTaskParams extends ModelParams {
  readonly id: string;
  readonly index: number;

  readonly description: string;

  readonly startDate: Date | null;
  readonly endDate: Date | null;

  readonly lab: Lab | string;
  readonly supervisor: User | string;
}

export class ResearchPlanTask extends Model implements ResearchPlanTaskParams {
  index: number;
  description: string;

  startDate: Date | null;
  endDate: Date | null;

  lab: Lab | string;
  supervisor: string | User;

  constructor(params: ResearchPlanTaskParams) {
    super(params);
    this.index = params.index;
    this.description = params.description;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.lab = params.lab;
    this.supervisor = params.supervisor;
  }

  async resolveLab(labs: LabService) {
    if (typeof this.lab === 'string') {
      this.lab = await firstValueFrom(labs.fetch(this.lab));
    }
    return this.lab;
  }

  async resolveSupervisor(userService: UserService) {
    if (typeof this.supervisor === 'string') {
      this.supervisor = await firstValueFrom(userService.fetch(this.supervisor));
    }
    return this.supervisor;
  }
}

export function researchPlanTaskFromJson(json: JsonObject): ResearchPlanTask {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json[ 'index' ] !== 'number') {
    throw new Error("ResearchPlanTask: 'index' must be an number");
  }

  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("ResearchPlanTask: Expected a string 'description'");
  }

  if (typeof json[ 'startDate' ] !== 'string' && json[ 'startDate' ] !== null) {
    throw new Error("ResearchPlanTask: 'startDate' must be a string or null");
  }
  const startDate = json[ 'startDate' ] ? parseISO(json[ 'startDate' ]) : null;
  if (typeof json[ 'endDate' ] !== 'string' && json[ 'endDate' ] !== null) {
    throw new Error("ResearchPlanTask: 'endDate' must be a string or null");
  }
  const endDate = json[ 'endDate' ] ? parseISO(json[ 'endDate' ]) : null;

  let lab: Lab | string;
  if (isJsonObject(json[ 'labId' ])) {
    lab = labFromJsonObject(json[ 'labId' ]);
  } else if (typeof json[ 'labId' ] === 'string') {
    lab = json[ 'labId' ]
  } else {
    throw new Error("Expected a json object or string 'labId'");
  }
  let supervisor: User | string;
  if (isJsonObject(json[ 'supervisorId' ])) {
    supervisor = userFromJsonObject(json[ 'supervisorId' ]);
  } else if (typeof json[ 'supervisorId' ] === 'string') {
    supervisor = json[ 'supervisorId' ]
  } else {
    throw new Error("Expected a json object or string 'supervisorId'");
  }

  return new ResearchPlanTask({
    ...baseParams,
    description: json[ 'description' ],
    startDate,
    endDate,
    index: json[ 'index' ],
    lab,
    supervisor
  });
}

export interface ResearchPlanTaskQuery extends ModelQuery<ResearchPlanTaskParams> {

}

function researchPlanTaskQueryToHttpParams(query: ResearchPlanTaskQuery): HttpParams {
  return new HttpParams();
}

export interface CreateResearchPlanTask {
  lab: string;
  supervisor: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
}


export function createResearchPlanTaskToJson(patch: CreateResearchPlanTask) {
  const startDate = patch.startDate && format(patch.startDate, 'yyyy-MM-DD');
  const endDate = patch.endDate && format(patch.endDate, 'yyyy-MM-DD');

  return {
    ...patch,
    startDate,
    endDate,
  };
}

export interface ResearchPlanTaskSlice {
  startIndex: number;
  endIndex?: number;
  items: CreateResearchPlanTask[];
}

export function researchPlanTaskSliceToJson(slice: ResearchPlanTaskSlice): JsonObject {
  return {
    startIndex: slice.startIndex,
    endIndex: slice.endIndex,
    items: slice.items.map(item => createResearchPlanTaskToJson(item))
  }
}


@Injectable()
export class ResearchPlanTaskService extends RelatedModelService<ResearchPlan, ResearchPlanTaskParams, ResearchPlanTaskQuery> {
  override readonly context = inject(ResearchPlanContext);
  override readonly modelFromJsonObject = researchPlanTaskFromJson;
  override readonly modelQueryToHttpParams = researchPlanTaskQueryToHttpParams;
  override readonly path = 'tasks';

}
