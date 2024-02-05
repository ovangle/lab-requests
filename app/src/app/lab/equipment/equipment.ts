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
import {
  ModelCollection,
  injectModelService,
} from 'src/app/common/model/model-collection';
import { defer, firstValueFrom } from 'rxjs';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Lab } from '../lab';
import { LabEquipmentProvision, labEquipmentProvisionFromJsonObject } from './provision/lab-equipment-provision';
import { ProvisionStatus, isProvisionStatus } from './provision/provision-status';

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
  installationPage: ModelIndexPage<EquipmentInstallation>;
  // Provisioining requests for this equipment which are not final.
  provisionsPage: ModelIndexPage<LabEquipmentProvision>;
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
  provisionsPage: ModelIndexPage<LabEquipmentProvision>;
  get provisions() {
    return this.provisionsPage.items;
  }

  constructor(params: EquipmentParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.tags = Array.from(params.tags!);
    this.trainingDescriptions = Array.from(params.trainingDescriptions!);
    this.installationsPage = params.installationPage;
    this.provisionsPage = params.provisionsPage;
  }
}


export function equipmentFromJsonObject(json: JsonObject): Equipment {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  if (
    !Array.isArray(json[ 'tags' ]) ||
    !json[ 'tags' ].every((t) => typeof t === 'string')
  ) {
    throw new Error("Expected an array of strings 'tags'");
  }
  if (
    !Array.isArray(json[ 'trainingDescriptions' ]) ||
    !json[ 'trainingDescriptions' ].every((t) => typeof t === 'string')
  ) {
    throw new Error("Expected an array of strings 'trainingDescriptions");
  }
  if (!isJsonObject(json[ 'installations' ])) {
    throw new Error("Expected a json object 'installations'")
  }
  const installationPage = modelIndexPageFromJsonObject(
    equipmentInstallationFromJsonObject,
    json[ 'installations' ]
  );

  if (!isJsonObject(json[ 'provisions' ])) {
    throw new Error("Expected a json object 'provisions'");
  }
  const provisionsPage = modelIndexPageFromJsonObject(
    labEquipmentProvisionFromJsonObject,
    json[ 'provisions' ]
  );

  return new Equipment({
    ...baseParams,
    name: json[ 'name' ],
    description: json[ 'description' ],
    tags: json[ 'tags' ],
    trainingDescriptions: json[ 'trainingDescriptions' ],
    installationPage,
    provisionsPage,
  });
}

export interface EquipmentInstallation extends ModelParams {
  equipmentId: string;
  labId: string;
  numInstalled: number;
  provisionStatus: ProvisionStatus;
}

export function equipmentInstallationFromJsonObject(obj: JsonObject): EquipmentInstallation {
  const baseParams = modelParamsFromJsonObject(obj);
  if (typeof obj[ 'equipmentId' ] !== 'string' || !validateIsUUID(obj[ 'equipmentId' ])) {
    throw new Error("Expected a uuid 'equipmentId")
  }
  if (typeof obj[ 'labId' ] !== 'string' || !validateIsUUID(obj[ 'labId' ])) {
    throw new Error("Expected a uuid 'labId'")
  }
  if (typeof obj[ 'numInstalled' ] !== 'number') {
    throw new Error('Expected a number numInstalled');
  }
  if (!isProvisionStatus(obj[ 'provisionStatus' ])) {
    throw new Error("Expected a provision status 'provisionStatus");
  }

  return {
    ...baseParams,
    equipmentId: obj[ 'equipmentId' ],
    labId: obj[ 'labId' ],
    numInstalled: obj[ 'numInstalled' ],
    provisionStatus: obj[ 'provisionStatus' ]
  }
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

export interface EquipmentInstallRequest {
  equipment: LabEquipmentCreateRequest | string;
  lab: string;
}


export interface EquipmentQuery {
  lab?: Lab | null;
  name?: string;
  searchText?: string;
}

export function equipmentQueryToHttpParams(query: Partial<EquipmentQuery>) {
  let params = new HttpParams();
  if (query.lab) {
    params = params.set('lab', query.lab.id);
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
  override model = Equipment;
  override modelFromJsonObject = equipmentFromJsonObject;
  override path = '/lab/equipments';
}

@Injectable()
export class EquipmentCollection
  extends ModelCollection<Equipment>
  implements EquipmentService {
  constructor(service: EquipmentService) {
    super(service);
  }
}

export function injectEquipmentService() {
  return injectModelService(EquipmentService, EquipmentCollection);
}
