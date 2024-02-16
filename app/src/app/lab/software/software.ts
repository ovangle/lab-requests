import { FormControl, FormGroup } from '@angular/forms';
import { Injectable, Type, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  ModelService,
  RestfulService,
} from 'src/app/common/model/model-service';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelContext } from 'src/app/common/model/context';

export interface SoftwareParams extends ModelParams {
  readonly id: string;

  name: string;
}

export function softwareFromJsonObject(json: JsonObject) {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }

  return new Software({
    ...baseParams,
    name: json['name'],
  });
}

export class Software extends Model {
  readonly type = 'software';

  name: string;

  constructor(params: SoftwareParams) {
    super(params);
    this.name = params.name;
  }
}

export interface SoftwarePatch {
  name: string;
  description: string;
}

export function softwarePatchToJsonObject(patch: SoftwarePatch): JsonObject {
  return {
    name: patch.name,
    description: patch.description,
  };
}

export interface NewSoftwareRequest {
  name: string;
  description: string;
}

export function isNewSoftwareRequest(obj: any): obj is NewSoftwareRequest {
  return typeof obj === 'object' && obj != null && typeof obj.name === 'string';
}

export function newSoftwareRequestForm() {
  return new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });
}

export interface SoftwareQuery {
  readonly searchText: string;
}

export function softwareQueryToHttpParams(lookup: Partial<SoftwareQuery>) {
  const params = new HttpParams();
  if (lookup.searchText) {
    params.set('search', lookup.searchText);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class SoftwareService extends RestfulService<Software> {
  override modelFromJsonObject = softwareFromJsonObject;
  override readonly createRequestToJsonObject = undefined;
  override readonly updateRequestToJsonObject = undefined;

  override path: string = '/lab/softwares';
}



@Injectable()
export class SoftwareContext extends ModelContext<Software> {
  override readonly service = inject(SoftwareService);

}
