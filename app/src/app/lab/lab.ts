import { Campus, CampusLookup, campusFromJsonObject } from 'src/app/uni/campus/campus';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';

import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { User, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type } from '@angular/core';
import { ModelCollection, injectModelService } from '../common/model/model-collection';
import { RestfulService } from '../common/model/model-service';

export interface LabParams extends ModelParams {
  readonly id: string;
  readonly discipline: Discipline;
  readonly campus: Campus;

  readonly supervisors: readonly User[];
}

export class Lab extends Model implements LabParams {
  readonly discipline: Discipline;
  readonly campus: Campus;

  readonly supervisors: readonly User[];

  constructor(params: LabParams) {
    super(params);
    this.discipline = params.discipline;
    this.campus = params.campus;
    this.supervisors = params.supervisors;
  }
}

export function labFromJsonObject(json: JsonObject): Lab {
  if (!isJsonObject(json)) {
    throw new Error('Not a json object');
  }
  const base = modelParamsFromJsonObject(json);

  if (typeof json['id'] !== 'string') {
    throw new Error("Expected a string 'id'");
  }
  if (!isDiscipline(json['discipline'])) {
    throw new Error("Expected a Discipline 'discipline'");
  }

  if (!isJsonObject(json['campus'])) {
    throw new Error("Expected a json object 'campus'");
  }
  const campus = campusFromJsonObject(json['campus']);

  if (!Array.isArray(json['supervisors']) || !json['supervisors'].every(isJsonObject)) {
    throw new Error("Expected an array of json objects 'supervisors'");
  }
  const supervisors = json['supervisors'].map(userFromJsonObject);

  return new Lab({
    ...base,
    id: json['id'],
    discipline: json['discipline'],
    campus,
    supervisors,
  });
}

@Injectable({ providedIn: 'root' })
export class LabService extends RestfulService<Lab>{
  override path: string = '/labs/lab';
  override model: Type<Lab> = Lab;
  override modelFromJsonObject(json: JsonObject): Lab {
    return labFromJsonObject(json);
  }

}

@Injectable({ providedIn: 'root' })
export class LabCollection extends ModelCollection<Lab, LabService> implements LabService {
  constructor(service: LabService) {
    super(service);
  }

}

export function injectLabService() {
  return injectModelService(LabService, LabCollection);
}