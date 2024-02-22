import { Campus, CampusLookup, campusFromJsonObject, formatCampus } from 'src/app/uni/campus/campus';
import { Discipline, formatDiscipline, isDiscipline } from 'src/app/uni/discipline/discipline';

import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelQuery,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { User, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type } from '@angular/core';
import { RestfulService } from '../common/model/model-service';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from '../equipment/installation/equipment-installation';
import { LabEquipmentProvision, labEquipmentProvisionFromJsonObject } from '../equipment/provision/equipment-provision';
import { Equipment } from '../equipment/equipment';
import { HttpParams } from '@angular/common/http';

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

  get name(): string {
    return `${formatCampus(this.campus)} -- ${formatDiscipline(this.discipline)} lab`
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

export interface LabQuery extends ModelQuery<Lab> {

}

function labQueryToHttpParams(query: LabQuery) {
  return new HttpParams();
}

export interface LabProfileParams extends LabParams {
  readonly equipmentInstallPage: ModelIndexPage<EquipmentInstallation>;
  readonly equipmentProvisionPage: ModelIndexPage<LabEquipmentProvision>;
}

export class LabProfile extends Lab implements LabProfileParams {
  readonly equipmentInstallPage: ModelIndexPage<EquipmentInstallation>;
  get equipmentInstalls() {
    return this.equipmentInstallPage.items;
  }
  readonly equipmentProvisionPage: ModelIndexPage<LabEquipmentProvision>;
  get equipmentProvisions() {
    return this.equipmentProvisionPage.items;
  }

  constructor(params: LabProfileParams) {
    super(params);
    this.equipmentInstallPage = params.equipmentInstallPage;
    this.equipmentProvisionPage = params.equipmentProvisionPage;
  }

  getInstall(equipment: Equipment): EquipmentInstallation | null {
    return this.equipmentInstalls
      .find(install => install.equipmentId) || null;
  }

  getProvision(equipment: Equipment): LabEquipmentProvision | null {
    return this.equipmentProvisions
      .find(provision => provision.equipmentId == equipment.id) || null;
  }


}

export function labProfileFromJsonObject(object: JsonObject) {
  const labParams = labFromJsonObject(object);
  if (!isJsonObject(object['equipmentInstalls'])) {
    throw new Error("Expected a json object 'equipmentInstalls'");
  }
  const equipmentInstallPage = modelIndexPageFromJsonObject(
    equipmentInstallationFromJsonObject,
    object['equipmentInstalls'],
  );
  if (!isJsonObject(object['equipmentProvisions'])) {
    throw new Error("Expected a json object 'equipmentProvisions'");
  }
  const equipmentProvisionPage = modelIndexPageFromJsonObject(
    labEquipmentProvisionFromJsonObject,
    object['equipmentProvisions'],
  );

  return new LabProfile({
    ...labParams,
    equipmentInstallPage,
    equipmentProvisionPage
  })
}


@Injectable({ providedIn: 'root' })
export class LabService extends RestfulService<Lab>{
  override path: string = '/labs/lab';
  override readonly modelFromJsonObject = labFromJsonObject;
  override readonly modelQueryToHttpParams = labQueryToHttpParams;
  override readonly createRequestToJsonObject = undefined;
  override readonly updateRequestToJsonObject = undefined;

}
