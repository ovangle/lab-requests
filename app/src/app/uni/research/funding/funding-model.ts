import { HttpParams } from '@angular/common/http';
import { Injectable, Type, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Role, roleFromJson } from 'src/app/user/common/role';
import {
  Model,
  ModelLookup,
  ModelMeta,
  ModelParams,
  ModelPatch,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  ModelCollection,
  injectModelQuery,
} from 'src/app/common/model/model-collection';
import {
  RestfulService,
  modelProviders,
} from 'src/app/common/model/model-service';
import {
  ResourceType,
  resourceTypeFromJson,
} from 'src/app/lab/work-unit/resource/resource-type';
import { isJsonObject } from 'src/app/utils/is-json-object';

export const FUNDING_MODEL_NAMES = ['student_project'];

export interface FundingModelParams extends ModelParams {
  name: string;
  description: string;
  requiresSupervisor: boolean;

  /**
   * The funding model is disabled for these roles.
   */
  readonly allowedRoles: Role[];

  /**
   * The work unit resources which are captured by this
   * funding model.
   */
  readonly capturedResources: ResourceType[];
}

export class FundingModel extends Model {
  readonly name: string;
  readonly description: string;
  readonly requiresSupervisor: boolean;

  readonly allowedRoles: Role[];
  readonly capturedResources: ResourceType[];

  constructor(params: FundingModelParams) {
    super(params);
    this.name = params.name!;
    this.description = params.description!;
    this.requiresSupervisor = params.requiresSupervisor!;

    this.allowedRoles = params.allowedRoles;
    this.capturedResources = params.capturedResources;
  }
}

export function fundingModelParamsFromJson(json: unknown): FundingModelParams {
  if (!isJsonObject(json)) {
    throw new Error('Expected a json object');
  }
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json['description'] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  if (typeof json['requiresSupervisor'] !== 'boolean') {
    throw new Error("Expected a boolean 'requiresSupervisor'");
  }
  let allowedRoles: Role[] = [];
  if (Array.isArray(json['allowedRoles'])) {
    allowedRoles = json['allowedRoles'].map(roleFromJson);
  }
  let capturedResources: ResourceType[] = [];
  if (Array.isArray(json['capturedResources'])) {
    capturedResources = json['capturedResources'].map(resourceTypeFromJson);
  }
  return {
    ...baseParams,
    name: json['name'],
    description: json['description'],
    requiresSupervisor: json['requiresSupervisor'],
    allowedRoles,
    capturedResources,
  };
}

export function fundingModelFromJson(json: unknown) {
  return new FundingModel(fundingModelParamsFromJson(json));
}

export interface FundingModelPatch extends ModelPatch<FundingModel> {
  readonly description: string;
  readonly requiresSupervisor: boolean;
}

export function fundingModelPatchToJson(patch: FundingModelPatch) {
  return {
    description: patch.description,
    requiresSupervisor: patch.requiresSupervisor,
  };
}

export interface FundingModelLookup extends ModelLookup<FundingModel> {
  // Searches for funding models with this exact name
  name_eq: string | string[];

  // Searches for the instance of this text anywhere in the funding model
  text: string;
}

function fundingModelLookupToHttpParams(lookup: Partial<FundingModelLookup>) {
  return new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class FundingModelMeta extends ModelMeta<
  FundingModel,
  FundingModelPatch,
  FundingModelLookup
> {
  override readonly model = FundingModel;
  override readonly modelParamsFromJson = fundingModelParamsFromJson;
  override readonly modelPatchToJson = fundingModelPatchToJson;
  override readonly lookupToHttpParams = fundingModelLookupToHttpParams;
}

@Injectable({ providedIn: 'root' })
export class FundingModelService extends RestfulService<
  FundingModel,
  FundingModelPatch,
  FundingModelLookup
> {
  override readonly metadata = inject(FundingModelMeta);
  override readonly path: string = '/uni/research/funding';

  getById(id: string): Observable<FundingModel> {
    return this.fetch(id);
  }

  getByName(name: string): Observable<FundingModel> {
    return this.fetch(name);
  }

  fetchByDescription(description: string) {
    return this.fetch(description);
  }

  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name } as FundingModelLookup).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }

  search(input: string): Observable<FundingModel[]> {
    return this.query({ text: input });
  }

  all(): Observable<FundingModel[]> {
    return this.query({ name_eq: FUNDING_MODEL_NAMES });
  }
}

@Injectable({ providedIn: 'root' })
export class FundingModelCollection extends ModelCollection<
  FundingModel,
  FundingModelPatch,
  FundingModelLookup
> {
  constructor() {
    super(inject(FundingModelService));
  }
}
