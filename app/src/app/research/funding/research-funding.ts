import { HttpParams } from '@angular/common/http';
import { Injectable, Type, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Role, roleFromJson } from 'src/app/user/common/role';
import {
  Model,
  ModelFactory,
  ModelQuery,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { RestfulService } from 'src/app/common/model/model-service';
import { JsonObject } from 'src/app/utils/is-json-object';

export const FUNDING_MODEL_NAMES = ['student_project'];

export class ResearchFunding extends Model {
  readonly name: string;
  readonly description: string;

  constructor(json: JsonObject) {
    super(json);

    if (typeof json['name'] !== 'string') {
      throw new Error("Expected a string 'name'");
    }
    this.name = json['name'];
    if (typeof json['description'] !== 'string') {
      throw new Error("Expected a string 'description'");
    }
    this.description = json['description'];
  }

  match(lookup: string | ResearchFundingLookup): boolean {
    return lookupId(lookup) === this.id || lookupName(lookup) === this.name;
  }
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

export interface ResearchFundingQuery extends ModelQuery<ResearchFunding> {
  // Searches for funding models with this exact name
  name_eq?: string | string[];

  // Searches for the instance of this text anywhere in the funding model
  text?: string;
}

function setResearchFundingQueryParams(params: HttpParams, query: Partial<ResearchFundingQuery>) {
  params = setModelQueryParams(params, query);
  if (query.name_eq) {
    const name = Array.isArray(query.name_eq) ? query.name_eq.join(',') : query.name_eq;
    params = params.set('name_eq', name);
  }
  if (query.text) {
    params = params.set('text', query.text);
  }
  return params;
}

export interface ResearchFundingLookup {
  id?: string;
  name?: string;
}

function lookupId(lookup: string | ResearchFundingLookup): string | null {
  if (typeof lookup === 'string') {
    return lookup;
  }
  return lookup.id || null;
}

function lookupName(lookup: string | ResearchFundingLookup): string | null {
  if (typeof lookup === 'string') {
    return null;
  }
  return lookup.name || null;
}


@Injectable({ providedIn: 'root' })
export class ResearchFundingService extends RestfulService<ResearchFunding, ResearchFundingQuery> {
  override readonly path: string = '/research/funding';
  override readonly model = ResearchFunding;

  override readonly setModelQueryParams = setResearchFundingQueryParams;

  lookup(lookup: string | ResearchFundingLookup, { useCache } = { useCache: true }): Observable<ResearchFunding | null> {
    if (useCache) {
      for (const v of this._cache.values()) {
        if (v.match(lookup)) {
          return of(v);
        }
      }
    }

    const id = lookupId(lookup);
    if (id) {
      return this.fetch(id, { useCache });
    }
    const name = lookupName(lookup);
    if (name) {
      return this.queryOne({ name_eq: name });
    }
    throw new Error('Research funding lookup must contain either id or name');
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
