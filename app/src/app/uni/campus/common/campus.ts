import { Injectable, Type, inject } from '@angular/core';
import {
  Model,
  ModelParams,
  ModelIndexPage,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { RestfulService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JsonObject } from 'src/app/utils/is-json-object';
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';

export type CampusCode = string;
export function isCampusCode(obj: any): obj is CampusCode {
  return typeof obj === 'string' && /^[A-Z]{0,8}$/.test(obj);
}
export function isOtherCampusCode(code: CampusCode | null | undefined) {
  return code === 'OTH';
}

export interface CampusParams extends ModelParams {
  readonly code: CampusCode;
  readonly name: string;
}

export function campusFromJsonObject(json: JsonObject): Campus {
  if (typeof json !== 'object' || json == null) {
    throw new Error('Expected a campus');
  }
  const obj: { [k: string]: unknown } = json as any;

  const baseParams = modelParamsFromJsonObject(obj);

  if (!isCampusCode(obj['code'])) {
    throw new Error('Expected a campus code');
  }

  return new Campus({
    ...baseParams,
    code: obj['code'],
    name: obj['name'] as string,
  });
}

export class Campus extends Model implements CampusParams {
  readonly code: CampusCode;

  readonly name: string;

  constructor(params: CampusParams) {
    super(params);
    this.code = params.code;
    this.name = params.name;
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

export interface CampusPatch {}

export function campusPatchToJsonObject(patch: CampusPatch): JsonObject {
  return {};
}

export interface CampusQuery {
  code?: CampusCode;
  textLike?: string;
}

export function campusLookupToHttpParams(
  lookup: Partial<CampusQuery>,
): HttpParams {
  let params = new HttpParams();
  if (lookup.code) {
    params = params.set('code_eq', lookup.code);
  }
  if (lookup.textLike) {
    params = params.set('text_like', lookup.textLike);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class CampusService extends RestfulService<Campus> {
  override model = Campus;
  override modelFromJsonObject = campusFromJsonObject;
  override modelPatchToJsonObject = campusPatchToJsonObject;
  override path = '/uni/campuses';

  getForCode(code: CampusCode): Observable<Campus | null> {
    return this.queryOne({ code });
  }
}

@Injectable({ providedIn: 'root' })
export class CampusCollection
  extends ModelCollection<Campus, CampusService>
  implements CampusService
{
  constructor(service: CampusService) {
    super(service);
  }

  getForCode(code: CampusCode) {
    return this.queryOne({ code });
  }
}

export function injectCampusService() {
  return injectModelService(CampusService, CampusCollection);
}
