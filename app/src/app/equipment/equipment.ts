import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import {
  Model,
  ModelUpdateRequest,
  ModelCreateRequest,
  ModelIndexPage,
  modelIndexPageFromJsonObject,
  ModelRef,
  ModelQuery,
  setModelQueryParams,
  modelId,
} from 'src/app/common/model/model';
import { RestfulService } from 'src/app/common/model/model-service';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Lab } from '../lab/lab';
import { EquipmentInstallation, equipmentInstallationCreateRequestToJsonObject, EquipmentInstallationRequest, EquipmentInstallationService } from './installation/equipment-installation';
import { Installable } from '../lab/common/installable/installable';
import { firstValueFrom } from 'rxjs';
import { Discipline, isDiscipline } from '../uni/discipline/discipline';
import { Campus } from '../uni/campus/campus';


export class Equipment extends Model implements Installable<EquipmentInstallation> {
  name: string;
  description: string;

  /**
   * The discipline types which would typically use this equipment.
   *
   */
  disciplines: Discipline[];

  get isAnyDiscipline() {
    return this.disciplines.length === 0;
  }

  tags: string[];

  trainingDescriptions: string[];

  installations: ModelIndexPage<EquipmentInstallation>;

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

    if (
      !Array.isArray(json['tags']) ||
      !json['tags'].every((t) => typeof t === 'string')
    ) {
      throw new Error("Expected an array of strings 'tags'");
    }
    this.tags = json['tags'];

    if (
      !Array.isArray(json['trainingDescriptions']) ||
      !json['trainingDescriptions'].every((t) => typeof t === 'string')
    ) {
      throw new Error("Expected an array of strings 'trainingDescriptions");
    }
    this.trainingDescriptions = json['trainingDescriptions'];

    if (
      !Array.isArray(json['disciplines'])
      || !json['disciplines'].every(isDiscipline)
    ) {
      throw new Error("Expected an array of disciplines 'disciplines'")
    }
    this.disciplines = json['disciplines'];


    if (!isJsonObject(json['installations'])) {
      throw new Error("Expected an array of json objects 'installations'")
    }
    this.installations = modelIndexPageFromJsonObject(
      EquipmentInstallation,
      json['installations']
    );
  }

  get installedLabIds(): ModelRef<Lab>[] {
    return this.installations.items.map(installation => installation.labId);
  }

  getInstallation(lab: ModelRef<Lab>) {
    return this.installations.items.find(install => install.labId === modelId(lab)) || null;
  }
}



export interface EquipmentCreateRequest extends ModelCreateRequest<Equipment> {
  name: string;
  description?: string;
  tags?: string[];
  trainingDescriptions?: string[];
  installations?: EquipmentInstallationRequest[];

}

export function isEquipmentCreateRequest(obj: unknown): obj is EquipmentCreateRequest {
  if (!isJsonObject(obj)) {
    return false;
  }
  return typeof obj['name'] === 'string';
}

export function equipmentCreateRequestToJsonObject(request: EquipmentCreateRequest): JsonObject {
  return {
    name: request.name,
    description: request.description,
    tags: request.tags,
    trainingDescriptions: request.trainingDescriptions,
    installations: request.installations
      ? request.installations.map(equipmentInstallationCreateRequestToJsonObject)
      : undefined
  };
}


export interface EquipmentQuery extends ModelQuery<Equipment> {
  name?: string;
  search?: string;
  installedLab?: ModelRef<Lab>;
  installedCampus?: ModelRef<Campus>[] | ModelRef<Campus>;
  discipline?: Discipline[] | Discipline;
}

export function setEquipmentQueryParams(params: HttpParams, query: Partial<EquipmentQuery>) {
  params = setModelQueryParams(params, query);

  if (query.installedLab) {
    params = params.set('installed_lab', modelId(query.installedLab));
  }

  if (query.installedCampus) {
    const v = Array.isArray(query.installedCampus)
      ? query.installedCampus.map(c => modelId(c)).join(',')
      : modelId(query.installedCampus);
    params = params.set('installed_campus', v);
  }

  if (query.discipline) {
    const v = Array.isArray(query.discipline)
      ? query.discipline.join(',')
      : query.discipline;
    params = params.set('discipline', v);
  }

  if (query.name) {
    params = params.set('name', query.name);
  }
  if (query.search) {
    params = params.set('search', query.search);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService extends RestfulService<Equipment, EquipmentQuery> {
  override path = '/equipments/equipment';
  override readonly model = Equipment;
  override readonly setModelQueryParams = setEquipmentQueryParams;


  create(request: EquipmentCreateRequest) {
    return this._doCreate(
      equipmentCreateRequestToJsonObject,
      request
    );
  }

  update(equipment: ModelRef<Equipment>, request: EquipmentCreateRequest) {
    return this._doUpdate(
      equipment,
      equipmentCreateRequestToJsonObject,
      request
    );
  }
}
