import { Injectable, Type, inject } from '@angular/core';
import {
  Model,
  ModelIndexPage,
  ModelQuery,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { RestfulService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { JsonObject } from 'src/app/utils/is-json-object';

export type CampusCode = string;
export function isCampusCode(obj: any): obj is CampusCode {
  return typeof obj === 'string' && /^[A-Z]{0,8}$/.test(obj);
}
export function isOtherCampusCode(code: CampusCode | null | undefined) {
  return code === 'OTH';
}

export class Campus extends Model {
  readonly code: CampusCode;
  readonly name: string;

  constructor(json: JsonObject) {
    super(json);
    if (!isCampusCode(json['code'])) {
      throw new Error('Expected a campus code');
    }
    this.code = json['code'];

    if (typeof json['name'] !== 'string') {
      throw new Error("Expected a string 'name'");
    }
    this.name = json['name'];
  }

  match(lookup: string | CampusLookup) {
    const id = campusIdFromCampusLookup(lookup);
    if (id) {
      return this.id === id;
    }
    const code = campusCodeFromCampusLookup(lookup);
    if (code) {
      return this.code === code;
    }
    return false;
  }
}

export type CampusFmt = 'code' | 'name' | 'full';

export function formatCampus(
  campus: Campus,
  format: CampusFmt = 'name',
): string {
  switch (format) {
    case 'code':
      return campus.code;
    case 'name':
      return campus.name;
    case 'full':
      return `${campus.code} (${campus.name})`;
    default:
      throw new Error(`Invalid format ${format}`);
  }

}

export interface CampusLookup {
  id?: string;
  code?: CampusCode;
}

function campusIdFromCampusLookup(lookup: CampusLookup | string) {
  if (typeof lookup === 'string') {
    return lookup;
  }
  return lookup.id || null;
}

function campusCodeFromCampusLookup(lookup: CampusLookup | string) {
  if (typeof lookup === 'string') {
    return null;
  }
  return lookup.code || null;
}

export interface CampusQuery extends ModelQuery<Campus> {
  code?: string;
}

export function setCampusQueryParams(
  params: HttpParams,
  query: Partial<CampusQuery>,
): HttpParams {
  params = setModelQueryParams(params, query);

  if (query.code) {
    params = params.set('code_eq', query.code);
  }
  if (query.search) {
    params = params.set('search', query.search);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class CampusService extends RestfulService<Campus, CampusQuery> {
  override path = '/uni/campus';
  override readonly model = Campus;

  override readonly setModelQueryParams = setCampusQueryParams;

  lookup(lookup: string | CampusLookup, { useCache } = { useCache: true }): Observable<Campus | null> {
    if (useCache) {
      for (const _value of this._cache.values()) {
        if (_value.match(lookup)) {
          return of(_value);
        }
      }
    }

    const id = campusIdFromCampusLookup(lookup);
    if (id) {
      return this.fetch(id);
    }
    const code = campusCodeFromCampusLookup(lookup);
    if (code) {
      return this.queryOne({ code });
    }
    throw new Error("Invalid campus lookup.");
  }

}
