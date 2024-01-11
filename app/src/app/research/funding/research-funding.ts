import { HttpParams } from '@angular/common/http';
import { Injectable, Type, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Role, roleFromJson } from 'src/app/user/common/role';
import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';
import { RestfulService } from 'src/app/common/model/model-service';
import { JsonObject } from 'src/app/utils/is-json-object';

export const FUNDING_MODEL_NAMES = ['student_project'];

export interface ResearchFundingParams extends ModelParams {
  name: string;
  description: string;
}

export class ResearchFunding extends Model {
  readonly name: string;
  readonly description: string;

  constructor(params: ResearchFundingParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
  }
}

export function researchFundingFromJsonObject(
  json: JsonObject,
): ResearchFundingParams {
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json['description'] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  return new ResearchFunding({
    ...baseParams,
    name: json['name'],
    description: json['description'],
  });
}

export interface ResearchFundingPatch {
  readonly description: string;
  readonly requiresSupervisor: boolean;
}

export function researchFundingPatchToJsonObject(
  patch: ResearchFundingPatch,
): JsonObject {
  return {
    description: patch.description,
    requiresSupervisor: patch.requiresSupervisor,
  };
}

export interface ResearchFundingQuery {
  // Searches for funding models with this exact name
  name_eq: string | string[];

  // Searches for the instance of this text anywhere in the funding model
  text: string;
}

function fundingModelLookupToHttpParams(lookup: Partial<ResearchFundingQuery>) {
  return new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class ResearchFundingService extends RestfulService<ResearchFunding> {
  override model: Type<ResearchFunding> = ResearchFunding;
  override modelFromJsonObject = researchFundingFromJsonObject;
  override readonly modelPatchToJsonObject = researchFundingPatchToJsonObject;
  override readonly path: string = '/uni/research/funding';

  getById(id: string): Observable<ResearchFunding> {
    return this.fetch(id);
  }

  getByName(name: string): Observable<ResearchFunding | null> {
    return this.queryOne({ name_eq: name });
  }

  fetchByDescription(description: string): Observable<ResearchFunding | null> {
    return this.queryOne({ description_eq: description });
  }

  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name }).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }

  search(input: string): Observable<ResearchFunding[]> {
    return this.query({ text: input });
  }

  all(): Observable<ResearchFunding[]> {
    return this.query({ name_eq: FUNDING_MODEL_NAMES });
  }
}

@Injectable({ providedIn: 'root' })
export class ResearchFundingCollection
  extends ModelCollection<ResearchFunding>
  implements ResearchFundingService
{
  constructor(service: ResearchFundingService) {
    super(service);
  }
  getById(id: string): Observable<ResearchFunding> {
    return this.fetch(id);
  }
  getByName(name: string): Observable<ResearchFunding | null> {
    return this.queryOne({ name_eq: name });
  }
  fetchByDescription(description: string): Observable<ResearchFunding | null> {
    return this.queryOne({ description_eq: description });
  }
  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name }).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }
  search(input: string): Observable<ResearchFunding[]> {
    return this.query({ s: input });
  }
  all(): Observable<ResearchFunding[]> {
    return this.query({});
  }
}

export function injectResearchFundingService() {
  return injectModelService(ResearchFundingService, ResearchFundingCollection);
}
