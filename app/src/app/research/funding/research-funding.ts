import { HttpParams } from '@angular/common/http';
import { Injectable, Type, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
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

export const FUNDING_MODEL_NAMES = [ 'student_project' ];

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
  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  return new ResearchFunding({
    ...baseParams,
    name: json[ 'name' ],
    description: json[ 'description' ],
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

export interface ResearchFundingLookup {
  id?: string;
  name?: string;
  description?: string;
}

export function researchFundingIdFromLookup(lookup: ResearchFundingLookup | string) {
  if (typeof lookup === 'string') {
    return lookup;
  }
  return lookup[ 'id' ] || null;
}

function researchFundingLookupToHttpParams(lookup: ResearchFundingLookup) {
  let params = new HttpParams();
  if (lookup.id) {
    params = params.set('id', lookup.id)
  }
  if (lookup.name) {
    debugger;
    params = params.set('name_eq', lookup.name);
  }
  if (lookup.description) {
    params = params.set('description_eq', lookup.description);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ResearchFundingService extends RestfulService<ResearchFunding> {
  override model: Type<ResearchFunding> = ResearchFunding;
  override modelFromJsonObject = researchFundingFromJsonObject;
  override readonly path: string = '/research/funding';

  lookup(lookup: string | ResearchFundingLookup) {
    if (typeof lookup === 'string') {
      return this.fetch(lookup);
    } else {
      return this.queryOne(researchFundingLookupToHttpParams(lookup));
    }
  }


  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name }).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }

  all(): Observable<ResearchFunding[]> {
    return this.query({});
  }
}

@Injectable({ providedIn: 'root' })
export class ResearchFundingCollection
  extends ModelCollection<ResearchFunding, ResearchFundingService>
  implements ResearchFundingService {
  constructor(service: ResearchFundingService) {
    super(service);
  }

  lookup(request: string | ResearchFundingLookup) {
    return this.service.lookup(request).pipe(
      this._maybeCacheResult
    );
  }


  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name }).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }
  all(): Observable<ResearchFunding[]> {
    if (this._cache.size == 0) {
      return this.query({});
    }

    return of(Array.from(this._cache.keys()).map(
      k => this._cache.get(k)!
    ));
  }
}

export function injectResearchFundingService() {
  return injectModelService(ResearchFundingService, ResearchFundingCollection);
}
