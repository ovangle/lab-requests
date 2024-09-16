import { Injectable, Type, inject } from "@angular/core";
import { Model, ModelIndexPage, ModelQuery, modelRefFromJson, setModelQueryParams } from "src/app/common/model/model";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ResearchPlan } from "../research-plan";
import { HttpParams } from "@angular/common/http";
import { Observable, firstValueFrom, map } from "rxjs";
import { format, formatISO, parseISO } from "date-fns";
import { RelatedModelService } from "src/app/common/model/context";
import { ResearchPlanContext } from "../research-plan-context";
import { Lab, LabService } from "src/app/lab/lab";
import { User, UserService } from "src/app/user/user";
import { isUUID } from "src/app/utils/is-uuid";


export class ResearchPlanTask extends Model {
  planId: string;
  index: number;
  description: string;

  startDate: Date | null;
  endDate: Date | null;

  labId: string;
  supervisorId: string;

  constructor(json: JsonObject) {
    super(json);
    if (!isUUID(json['planId'])) {
      throw new Error("Expected a string 'planId'");
    }
    this.planId = json['planId']

    if (typeof json['index'] !== 'number') {
      throw new Error("ResearchPlanTask: 'index' must be an number");
    }
    this.index = json['index'];

    if (typeof json['description'] !== 'string') {
      throw new Error("ResearchPlanTask: Expected a string 'description'");
    }
    this.description = json['description'];

    if (typeof json['startDate'] !== 'string' && json['startDate'] !== null) {
      throw new Error("ResearchPlanTask: 'startDate' must be a string or null");
    }
    this.startDate = json['startDate'] ? parseISO(json['startDate']) : null;
    if (typeof json['endDate'] !== 'string' && json['endDate'] !== null) {
      throw new Error("ResearchPlanTask: 'endDate' must be a string or null");
    }
    this.endDate = json['endDate'] ? parseISO(json['endDate']) : null;

    if (!isUUID(json['labId'])) {
      throw new Error("Expected a uuid 'labId'")
    }
    this.labId = json['labId']
    if (!isUUID(json['supervisorId'])) {
      throw new Error("Expected a UUID 'supervisorId");
    }
    this.supervisorId = json['supervisorId'];
  }

  async resolveLab(labs: LabService) {
    return await firstValueFrom(labs.fetch(this.labId));
  }

  async resolveSupervisor(userService: UserService) {
    return await firstValueFrom(userService.fetch(this.supervisorId));

  }
}

export interface ResearchPlanTaskQuery extends ModelQuery<ResearchPlanTask> {

}

function setResearchPlanTaskQueryParams(params: HttpParams, query: Partial<ResearchPlanTaskQuery>): HttpParams {
  params = setModelQueryParams(params, query);
  return params;
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
export class ResearchPlanTaskService extends RelatedModelService<ResearchPlan, ResearchPlanTask, ResearchPlanTaskQuery> {
  override readonly context = inject(ResearchPlanContext);
  override readonly model = ResearchPlanTask;
  override readonly setModelQueryParams = setResearchPlanTaskQueryParams;
  override readonly path = 'tasks';

}
