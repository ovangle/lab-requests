import { validate as validateIsUUID } from 'uuid';
import {
  Model,
  ModelUpdateRequest,
  ModelCreateRequest,
  ModelIndexPage,
  ModelParams,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
  ModelRef,
  ModelQuery,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { Injectable, Provider, Type, inject } from '@angular/core';
import { RestfulService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { ModelContext } from 'src/app/common/model/context';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Lab } from '../lab/lab';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from './installation/equipment-installation';
import { CreateEquipmentProvisionRequest, EquipmentProvision, equipmentProvisionFromJsonObject } from './provision/equipment-provision';
import { Installable } from '../lab/common/installable/installable';
import { LabInstallationService, LabInstallationQuery } from '../lab/common/installable/installation';

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
  activeProvisionsPage: ModelIndexPage<EquipmentProvision>;
  installationPage: ModelIndexPage<EquipmentInstallation>;
}

export class Equipment extends Model implements Installable<EquipmentInstallation>, EquipmentParams {
  name: string;
  description: string;

  tags: string[];

  trainingDescriptions: string[];

  /**
   * A map of lab ids to counts
   */
  installationPage: ModelIndexPage<EquipmentInstallation>;
  get installations() {
    return this.installationPage.items;
  }

  activeProvisionsPage: ModelIndexPage<EquipmentProvision>;
  get activeProvisions() {
    return this.activeProvisionsPage.items;
  }

  constructor(params: EquipmentParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.tags = Array.from(params.tags!);
    this.trainingDescriptions = Array.from(params.trainingDescriptions!);
    this.activeProvisionsPage = params.activeProvisionsPage;
    this.installationPage = params.installationPage;
  }

  getCurrentInstallation(
    lab: string | Lab,
    service: LabInstallationService<Equipment, EquipmentInstallation, LabInstallationQuery<any, EquipmentInstallation>>): Promise<EquipmentInstallation | null> {
    throw new Error('Method not implemented.');
  }

  /*
  labInstallations(lab: Lab | string): EquipmentInstallation[] {
    const labId = (lab instanceof Lab) ? lab.id : lab;
    return this.installations.filter(
      install => install.labId === labId
    );
  }

  currentLabInstallation(lab: Lab | string): EquipmentInstallation | null {
    return this.labInstallations(lab)
      .find(install => install.isInstalled) || null;
  }

  pendingLabInstallation(lab: Lab | string): EquipmentInstallation | null {
    return this.labInstallations(lab)
      .find(install => install.isPendingInstallation) || null;
  }

  activeUnallocatedProvisions(): EquipmentProvision[] {
    return this.activeProvisions.filter(
      provision => provision.installation == null
    );
  }

  activeProvision(lab: Lab): EquipmentProvision | null {
    return this.activeProvisions.find(
      provision => provision.installation?.labId === lab.id && provision.isActive
    ) || null;
  }
  */
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

  if (!isJsonObject(json['activeProvisions'])) {
    throw new Error("Expected a json object 'activeProvisions'");
  }
  const activeProvisionsPage = modelIndexPageFromJsonObject(
    equipmentProvisionFromJsonObject,
    json['activeProvisions']
  );

  return new Equipment({
    ...baseParams,
    name: json['name'],
    description: json['description'],
    tags: json['tags'],
    trainingDescriptions: json['trainingDescriptions'],
    activeProvisionsPage: activeProvisionsPage,
    installationPage,
  });
}


export interface EquipmentUpdateRequest extends ModelUpdateRequest<Equipment> {
  description: string;
  tags: string[];
  trainingDescriptions: string[];
}

function equipentUpdateRequestToJsonObject(patch: EquipmentUpdateRequest): JsonObject {
  return {
    ...patch
  };
}

export interface EquipmentCreateRequest extends ModelCreateRequest<Equipment> {
  name: string;
  description?: string;
  tags?: string[];
  trainingDescriptions?: string[];

  initialProvisions?: CreateEquipmentProvisionRequest[];
}

export function isEquipmentCreateRequest(obj: unknown): obj is EquipmentCreateRequest {
  if (!isJsonObject(obj)) {
    return false;
  }
  return typeof obj['name'] === 'string';
}

export function equipmentCreateRequestToJsonObject(request: EquipmentCreateRequest): JsonObject {
  return {
    ...request
  };
}


export interface EquipmentQuery extends ModelQuery<Equipment> {
  installedInLab?: Lab | null;
  name?: string;
  searchText?: string;
}

export function setEquipmentQueryParams(params: HttpParams, query: Partial<EquipmentQuery>) {
  params = setModelQueryParams(params, query);

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
export class EquipmentService extends RestfulService<Equipment, EquipmentQuery> {
  override path = '/labs/equipment';
  override readonly modelFromJsonObject = equipmentFromJsonObject;
  override readonly setModelQueryParams = setEquipmentQueryParams;

  create(request: EquipmentCreateRequest) {
    return this._doCreate(
      equipmentCreateRequestToJsonObject,
      request
    );
  }

  update(equipment: ModelRef<Equipment>, request: EquipmentUpdateRequest) {
    return this._doUpdate(
      (_, request) => equipentUpdateRequestToJsonObject(request),
      equipment,
      request
    );
  }
}

