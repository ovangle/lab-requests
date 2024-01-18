import {
  Model,
  ModelParams,
  ModelPatch,
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
import { JsonObject } from 'src/app/utils/is-json-object';

export class Equipment extends Model {
  name: string;
  description: string;

  tags: string[];

  trainingDescriptions: string[];

  constructor(params: EquipmentParams & { readonly id: string }) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.tags = Array.from(params.tags!);
    this.trainingDescriptions = Array.from(params.trainingDescriptions!);
  }
}

export interface EquipmentParams extends ModelParams {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
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

  return new Equipment({
    ...baseParams,
    name: json[ 'name' ],
    description: json[ 'description' ],
    tags: json[ 'tags' ],
    trainingDescriptions: json[ 'trainingDescriptions' ],
  });
}

export interface EquipmentPatch extends ModelPatch<Equipment> {
  name: string;
  description: string;
  tags: string[];
  trainingDescriptions: string[];
}

export interface EquipmentQuery {
  name?: string;
  searchText?: string;
}

export function equipmentQueryToHttpParams(query: Partial<EquipmentQuery>) {
  let params = new HttpParams();
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

@Injectable()
export class EquipmentContext extends ModelContext<Equipment, EquipmentPatch> {
  readonly service = injectEquipmentService();
  override _doUpdate(id: string, patch: EquipmentPatch): Promise<Equipment> {
    return firstValueFrom(this.service.update(id, patch));
  }
  readonly equipment$ = defer(() => this.committed$);
}

export function injectEquipmentService() {
  return injectModelService(EquipmentService, EquipmentCollection);
}
