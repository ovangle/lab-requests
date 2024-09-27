import { Campus, CampusLookup, formatCampus } from 'src/app/uni/campus/campus';
import { Discipline, formatDiscipline, isDiscipline } from 'src/app/uni/discipline/discipline';

import {
  Model,
  ModelIndexPage,
  ModelQuery,
  ModelRef,
  modelId,
  modelIndexPageFromJsonObject,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { User, UserService } from 'src/app/user/user';
import { Injectable, Type } from '@angular/core';
import { RestfulService } from '../common/model/model-service';
import { EquipmentInstallation } from '../equipment/installation/equipment-installation';
import { EquipmentInstallationProvision } from '../equipment/provision/equipment-provision';
import { Equipment } from '../equipment/equipment';
import { HttpParams } from '@angular/common/http';
import { StorageType, isStorageType } from './storage/lab-storage-type';
import { isUUID } from '../utils/is-uuid';
import { LabStorage } from './common/storable/lab-storage';
import { LabDisposal } from './common/disposable/lab-disposal';


export class Lab extends Model {
  readonly discipline: Discipline;
  readonly campus: Campus;

  readonly supervisors: ModelIndexPage<User>;

  readonly storages: ModelIndexPage<LabStorage>;
  readonly disposals: ModelIndexPage<LabDisposal>;

  constructor(json: JsonObject) {
    super(json);

    if (!isDiscipline(json['discipline'])) {
      throw new Error("Expected a Discipline 'discipline'");
    }
    this.discipline = json['discipline'];

    if (!isJsonObject(json['campus'])) {
      throw new Error("Expected a json object 'campus'");
    }
    this.campus = new Campus(json['campus']);

    if (!isJsonObject(json['supervisors'])) {
      throw new Error("Expected a json object 'supervisors'");
    }
    this.supervisors = modelIndexPageFromJsonObject(User, json['supervisors']);

    if (!isJsonObject(json['storages'])) {
      throw new Error("Expected a json object 'storages'");
    }
    this.storages = modelIndexPageFromJsonObject(LabStorage, json['storages'])

    if (!isJsonObject(json['disposals'])) {
      throw new Error("Expected a json object 'disposals'");
    }
    this.disposals = modelIndexPageFromJsonObject(LabDisposal, json['disposals']);
  }

  get name(): string {
    return `${formatCampus(this.campus)} -- ${formatDiscipline(this.discipline)} lab`
  }
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

  if (Array.isArray(query.discipline) && query.discipline.length > 0) {
    params = params.set('discipline', query.discipline.join(','))
  } else if (isDiscipline(query.discipline)) {
    params = params.set('discipline', query.discipline);
  }

  return params;
}

export class LabProfile extends Lab {
  readonly equipmentInstallPage: ModelIndexPage<EquipmentInstallation>;
  get equipmentInstalls() {
    return this.equipmentInstallPage.items;
  }

  constructor(json: JsonObject) {
    super(json);

    if (!isJsonObject(json['equipmentInstalls'])) {
      throw new Error("Expected a json object 'equipmentInstalls'");
    }
    this.equipmentInstallPage = modelIndexPageFromJsonObject(
      EquipmentInstallation,
      json['equipmentInstalls']
    );
  }

  getInstall(equipment: Equipment): EquipmentInstallation | null {
    return this.equipmentInstalls
      .find(install => install.equipmentId == equipment.id) || null;
  }
}


@Injectable({ providedIn: 'root' })
export class LabService extends RestfulService<Lab, LabQuery> {
  override path: string = '/labs/lab';
  override readonly model = Lab;

  override readonly setModelQueryParams = setLabQueryParams;
}
