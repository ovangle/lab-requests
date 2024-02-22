import { validate as validateIsUUID } from 'uuid';
import {
  Model,
  ModelAction,
  ModelCreate,
  ModelIndexPage,
  ModelParams,
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
import { CreateEquipmentProvisionRequest, EquipmentProvision, equipmentProvisionFromJsonObject } from './provision/equipment-provision';

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
  activeProvisionsPage: ModelIndexPage<EquipmentProvision>;
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
    this.installationsPage = params.installationPage;
  }

  labInstallations(lab: Lab): EquipmentInstallation[] {
    return this.installations.filter(
      install => install.labId === lab.id
    );
  }

  currentLabInstallation(lab: Lab): EquipmentInstallation | null {
    return this.labInstallations(lab)
      .find(install => install.isInstalled) || null;
  }

  pendingLabInstallation(lab: Lab): EquipmentInstallation | null {
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


export interface EquipmentUpdateRequest extends ModelAction<Equipment> {
  description: string;
  tags: string[];
  trainingDescriptions: string[];
}

function equipmentPatchToJsonObject(patch: EquipmentUpdateRequest) {
  return {
    ...patch
  };
}

export interface EquipmentCreateRequest extends ModelCreate<Equipment> {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];

  initialProvisions?: CreateEquipmentProvisionRequest[];
}

export function equipmentCreateToJsonObject(request: EquipmentCreateRequest): JsonObject {
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
export class EquipmentService extends RestfulService<Equipment, EquipmentQuery, EquipmentCreateRequest, EquipmentUpdateRequest> {
  override path = '/labs/equipment';
  override readonly modelFromJsonObject = equipmentFromJsonObject;
  override readonly modelQueryToHttpParams = equipmentQueryToHttpParams;
  override readonly createToJsonObject = equipmentCreateToJsonObject;
  override readonly actionToJsonObject = equipmentPatchToJsonObject;
}

