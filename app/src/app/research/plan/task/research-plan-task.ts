import { Injectable, Type, inject } from "@angular/core";
import { ModelIndexPage, ModelParams, ModelQuery, modelParamsFromJsonObject } from "src/app/common/model/model";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { JsonObject } from "src/app/utils/is-json-object";
import { ResearchPlan, ResearchPlanContext } from "../research-plan";
import { HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { format, formatISO, parseISO } from "date-fns";
import { RelatedModelService } from "src/app/common/model/context";


export interface ResearchPlanTask extends ModelParams {
  readonly id: string;
  readonly index: number;

  readonly description: string;

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

  if (typeof json[ 'labId' ] !== 'string') {
    throw new Error("ResearchPlanTask: 'labId' must be a string");
  }
  if (typeof json[ 'supervisorId' ] !== 'string') {
    throw new Error("ResearchPlanTask: 'supervisorId' must be a string");
  }
  return {
    ...baseParams,
    description: json[ 'description' ],
    startDate,
    endDate,
    index: json[ 'index' ],
    labId: json[ 'labId' ],
    supervisorId: json[ 'supervisorId' ],
  };
}

export interface ResearchPlanTaskQuery extends ModelQuery<ResearchPlanTask> {

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


@Injectable()
export class ResearchPlanTaskService extends RelatedModelService<ResearchPlan, ResearchPlanTask, ResearchPlanTaskQuery> {
  override readonly context = inject(ResearchPlanContext);
  override readonly modelFromJsonObject = researchPlanTaskFromJson;
  override readonly modelQueryToHttpParams = researchPlanTaskQueryToHttpParams;
  override readonly path = 'tasks';

}
