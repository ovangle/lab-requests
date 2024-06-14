import { Campus, CampusLookup, campusFromJsonObject, formatCampus } from 'src/app/uni/campus/campus';
import { Discipline, formatDiscipline, isDiscipline } from 'src/app/uni/discipline/discipline';

import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelQuery,
  ModelRef,
  modelId,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { User, userFromJsonObject } from 'src/app/user/common/user';
import { Injectable, Type } from '@angular/core';
import { RestfulService } from '../common/model/model-service';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from '../equipment/installation/equipment-installation';
import { EquipmentProvision, equipmentProvisionFromJsonObject } from '../equipment/provision/equipment-provision';
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

  if (typeof json[ 'id' ] !== 'string') {
    throw new Error("Expected a string 'id'");
  }
  if (!isDiscipline(json[ 'discipline' ])) {
    throw new Error("Expected a Discipline 'discipline'");
  }

  if (!isJsonObject(json[ 'campus' ])) {
    throw new Error("Expected a json object 'campus'");
  }
  const campus = campusFromJsonObject(json[ 'campus' ]);

  if (!Array.isArray(json[ 'supervisors' ]) || !json[ 'supervisors' ].every(isJsonObject)) {
    throw new Error("Expected an array of json objects 'supervisors'");
  }
  const supervisors = json[ 'supervisors' ].map(userFromJsonObject);

  return new Lab({
    ...base,
    id: json[ 'id' ],
    discipline: json[ 'discipline' ],
    campus,
    supervisors,
  });
}

export interface LabQuery extends ModelQuery<Lab> {
  campus?: ModelRef<Campus> | ModelRef<Campus>[];
  discipline?: Discipline | Discipline[];
}

function setLabQueryParams(params: HttpParams, query: Partial<LabQuery>) {
  params = setModelQueryParams(params, query);

  if (Array.isArray(query.campus)) {
    const modelIds = query.campus.map(c => modelId(c));
    params = params.set('campus', modelIds.join(','));
  } else if (query.campus) {
    params = params.set('campus', modelId(query.campus));
  }

  if (Array.isArray(query.discipline)) {
    params = params.set('discipline', query.discipline.join(','))
  } else if (query.discipline) {
    params = params.set('discipline', query.discipline);
  }

  return params;
}

export interface LabProfileParams extends LabParams {
  readonly equipmentInstallPage: ModelIndexPage<EquipmentInstallation>;
  readonly equipmentProvisionPage: ModelIndexPage<EquipmentProvision>;
}

export class LabProfile extends Lab implements LabProfileParams {
  readonly equipmentInstallPage: ModelIndexPage<EquipmentInstallation>;
  get equipmentInstalls() {
    return this.equipmentInstallPage.items;
  }
  readonly equipmentProvisionPage: ModelIndexPage<EquipmentProvision>;
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
      .find(install => modelId(install.equipment) == equipment.id) || null;
  }

  getProvision(equipment: Equipment): EquipmentProvision | null {
    return this.equipmentProvisions
      .find(provision => modelId(provision.target) == equipment.id) || null;
  }
}

export function labProfileFromJsonObject(object: JsonObject) {
  const labParams = labFromJsonObject(object);
  if (!isJsonObject(object[ 'equipmentInstalls' ])) {
    throw new Error("Expected a json object 'equipmentInstalls'");
  }
  const equipmentInstallPage = modelIndexPageFromJsonObject(
    equipmentInstallationFromJsonObject,
    object[ 'equipmentInstalls' ],
  );
  if (!isJsonObject(object[ 'equipmentProvisions' ])) {
    throw new Error("Expected a json object 'equipmentProvisions'");
  }
  const equipmentProvisionPage = modelIndexPageFromJsonObject(
    equipmentProvisionFromJsonObject,
    object[ 'equipmentProvisions' ],
  );

  return new LabProfile({
    ...labParams,
    equipmentInstallPage,
    equipmentProvisionPage
  })
}


@Injectable({ providedIn: 'root' })
export class LabService extends RestfulService<Lab, LabQuery> {
  override path: string = '/labs';
  override readonly modelFromJsonObject = labFromJsonObject;
  override readonly setModelQueryParams = setLabQueryParams;
}
