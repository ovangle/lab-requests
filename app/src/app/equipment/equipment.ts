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
  isEqualModelRefs,
} from 'src/app/common/model/model';
import { Injectable, Provider, Type, inject } from '@angular/core';
import { RestfulService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { ModelContext } from 'src/app/common/model/context';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Lab } from '../lab/lab';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from './installation/equipment-installation';
import { EquipmentProvision, EquipmentProvisionQuery, NewEquipmentRequest, equipmentProvisionFromJsonObject } from './provision/equipment-provision';
import { Installable } from '../lab/common/installable/installable';
import { LabInstallationService, LabInstallationQuery } from '../lab/common/installable/installation';
import { LabProvisionService, LabProvisionQuery, LabProvision } from '../lab/common/provisionable/provision';
import { firstValueFrom } from 'rxjs';
import { softwareInstallationFromJsonObject } from '../software/installation/software-installation';
import { Discipline, isDiscipline } from '../uni/discipline/discipline';

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  disciplines: Discipline[];
  tags: string[];
  trainingDescriptions: string[];

  currentInstallations: EquipmentInstallation[];
}

export class Equipment extends Model implements Installable<EquipmentInstallation>, EquipmentParams {
  name: string;
  description: string;

  /**
   * The discipline types which would typically use this equipment.
   */
  disciplines: Discipline[];
  tags: string[];

  trainingDescriptions: string[];

  currentInstallations: EquipmentInstallation[];

  constructor(params: EquipmentParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.disciplines = params.disciplines;
    this.tags = Array.from(params.tags!);
    this.trainingDescriptions = Array.from(params.trainingDescriptions!);
    this.currentInstallations = Array.from(params.currentInstallations);
  }

  getCurrentInstallation(
    lab: string | Lab
  ) {
    return this.currentInstallations.find((install) => isEqualModelRefs(install.lab, lab))
  }

  getActiveProvisions<TProvision extends EquipmentProvision>(
    lab: ModelRef<Lab>,
    service: LabProvisionService<EquipmentInstallation, TProvision, EquipmentProvisionQuery>
  ): Promise<ModelIndexPage<TProvision>> {
    return firstValueFrom(service.queryPage({
      target: { installable: this, lab: lab },
    }));

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

  if (
    !Array.isArray(json[ 'disciplines' ])
    || !json[ 'disciplines' ].every(isDiscipline)
  ) {
    throw new Error("Expected an array of disciplines 'disciplines'")
  }


  if (!Array.isArray(json[ 'currentInstallations' ]) || !json[ 'currentInstallations' ].every(isJsonObject)) {
    throw new Error("Expected an array of json objects 'currentInstallations'")
  }
  const currentInstallations = json[ 'currentInstallations' ].map(
    equipmentInstallationFromJsonObject
  );


  return new Equipment({
    ...baseParams,
    name: json[ 'name' ],
    description: json[ 'description' ],
    tags: json[ 'tags' ],
    disciplines: json[ 'disciplines' ],
    trainingDescriptions: json[ 'trainingDescriptions' ],
    currentInstallations
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

  initialProvisions?: NewEquipmentRequest[];
}

export function isEquipmentCreateRequest(obj: unknown): obj is EquipmentCreateRequest {
  if (!isJsonObject(obj)) {
    return false;
  }
  return typeof obj[ 'name' ] === 'string';
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

