import { validate as validateIsUUID } from 'uuid';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelPatch,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import { Injectable, Provider, Type, inject } from '@angular/core';
import { RestfulService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { ModelContext } from 'src/app/common/model/context';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Lab } from '../lab/lab';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from './installation/equipment-installation';

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
  installationPage: ModelIndexPage<EquipmentInstallation>;
}

export class Equipment extends Model {
  name: string;
  description: string;

  tags: string[];

  trainingDescriptions: string[];

  /**
   * A map of lab ids to counts
   */
  installationsPage: ModelIndexPage<EquipmentInstallation>;
  get installations() {
    return this.installationsPage.items;
  }

  constructor(params: EquipmentParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.tags = Array.from(params.tags!);
    this.trainingDescriptions = Array.from(params.trainingDescriptions!);
    this.installationsPage = params.installationPage;
  }
}


export function equipmentFromJsonObject(json: JsonObject): Equipment {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json['description'] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  if (
    !Array.isArray(json['tags']) ||
    !json['tags'].every((t) => typeof t === 'string')
  ) {
    throw new Error("Expected an array of strings 'tags'");
  }
  if (
    !Array.isArray(json['trainingDescriptions']) ||
    !json['trainingDescriptions'].every((t) => typeof t === 'string')
  ) {
    throw new Error("Expected an array of strings 'trainingDescriptions");
  }
  if (!isJsonObject(json['installations'])) {
    throw new Error("Expected a json object 'installations'")
  }
  const installationPage = modelIndexPageFromJsonObject(
    equipmentInstallationFromJsonObject,
    json['installations']
  );

  return new Equipment({
    ...baseParams,
    name: json['name'],
    description: json['description'],
    tags: json['tags'],
    trainingDescriptions: json['trainingDescriptions'],
    installationPage,
  });
}


export interface EquipmentPatch {
  name: string;
  description?: string;
  tags?: string[];
  trainingDescriptions?: string;
}

export interface LabEquipmentCreateRequest {
  name: string;
  description?: string;
  tags?: string[];
  trainingDescriptions?: string;
}

export function labEquipmentCreateRequestToJson(request: LabEquipmentCreateRequest): JsonObject {
  return {
    ...request
  };
}


export interface EquipmentQuery {
  installedInLab?: Lab | null;
  name?: string;
  searchText?: string;
}

export function equipmentQueryToHttpParams(query: Partial<EquipmentQuery>) {
  let params = new HttpParams();
  if (query.installedInLab) {
    params = params.set('installed_in_lab', query.installedInLab.id);
  }

  if (query.name) {
    params = params.set('name', query.name);
  }
  if (query.searchText) {
    params = params.set('search', query.searchText);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService extends RestfulService<Equipment> {
  override path = '/labs/equipment';
  override modelFromJsonObject = equipmentFromJsonObject;
  override readonly createRequestToJsonObject = undefined;
  override readonly updateRequestToJsonObject = undefined;
}

