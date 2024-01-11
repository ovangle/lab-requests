import { Campus, campusFromJsonObject } from 'src/app/uni/campus/common/campus';
import { LabType, isLabType } from '../type/lab-type';
import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { isJsonObject } from 'src/app/utils/is-json-object';

export interface LabParams extends ModelParams {
  readonly id: string;
  readonly type: LabType;
  readonly campus: Campus;

  readonly supervisorEmails: readonly string[];
}

export class Lab extends Model implements LabParams {
  readonly type: LabType;
  readonly campus: Campus;

  readonly supervisorEmails: readonly string[];

  constructor(params: LabParams) {
    super(params);
    this.type = params.type;
    this.campus = params.campus;
    this.supervisorEmails = params.supervisorEmails;
  }
}

function labParamsFromJson(json: unknown): LabParams {
  if (!isJsonObject(json)) {
    throw new Error('Not a json object');
  }
  const base = modelParamsFromJsonObject(json);

  if (typeof json['id'] !== 'string') {
    throw new Error("Expected a string 'id'");
  }
  if (!isLabType(json['type'])) {
    throw new Error("Expected a lab type 'type'");
  }

  if (!Array.isArray(json['supervisorEmails'])) {
    throw new Error("Expected an array 'supervisorEmails'");
  }

  const supervisorEmails = Array.from(json['supervisorEmails']);

  if (!isJsonObject(json['campus'])) {
    throw new Error("Expected a json object 'campus'");
  }

  const campus = campusFromJsonObject(json['campus']);

  return {
    ...base,
    id: json['id'],
    type: json['type'],
    campus,
    supervisorEmails,
  };
}

export function labFromJson(json: unknown) {
  return new Lab(labParamsFromJson(json));
}
