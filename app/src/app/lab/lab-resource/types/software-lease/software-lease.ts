import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { ModelOf, ModelQuery, ModelRef, modelRefJsonDecoder, resolveModelRef, resolveRef } from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

import { ResourceParams, Resource, resourceParamsFromJsonObject, ResourcePatch, ResourceService, resourcePatchToJsonObject } from '../../resource';
import { SoftwareProvision, SoftwareProvisionService, softwareProvisionFromJsonObject } from 'src/app/software/provision/software-provision';
import { Software, SoftwareService, softwareFromJsonObject } from 'src/app/software/software';
import { ModelService } from 'src/app/common/model/model-service';

export interface SoftwareLeaseParams extends ResourceParams {
  software: ModelRef<Software>;
  softwareProvision: ModelRef<SoftwareProvision> | null;
}

export class SoftwareLease extends Resource implements SoftwareLeaseParams {
  override readonly type = 'software_lease';

  software: ModelRef<Software>;
  softwareProvision: ModelRef<SoftwareProvision> | null;

  constructor(params: SoftwareLeaseParams) {
    super(params);

    this.software = params.software;
    this.softwareProvision = params.softwareProvision;
  }

  resolveSoftware(service: SoftwareService) {
    return resolveModelRef(this, 'software', service as any);
  }

  resolveSoftwareProvision(service: SoftwareProvisionService) {
    return resolveModelRef(this, 'softwareProvision', service as any);
  }
}

export function softwareLeaseFromJsonObject(json: JsonObject): SoftwareLease {
  const resourceParams = resourceParamsFromJsonObject(json);

  const softwareFromJson = modelRefJsonDecoder('software', softwareFromJsonObject);
  const softwareProvisionFromJson = modelRefJsonDecoder('softwareProvision', softwareProvisionFromJsonObject);

  return new SoftwareLease({
    ...resourceParams,
    software: softwareFromJson(json),
    softwareProvision: softwareProvisionFromJson(json)
  });
}

export interface SoftwareLeasePatch extends ResourcePatch {

}

export function softwareLeasePatchToJsonObject(current: SoftwareLease | null, patch: SoftwareLeasePatch): JsonObject {
  return {
    ...resourcePatchToJsonObject(patch)
  };
}

@Injectable()
export class SoftwareLeaseService extends ResourceService<SoftwareLease, SoftwareLeasePatch> {
  override readonly resourceType = 'software_lease';
  override patchToJsonObject(current: SoftwareLease | null, patch: SoftwareLeasePatch): JsonObject {
    return softwareLeasePatchToJsonObject(current, patch)
  }
  override modelFromJsonObject(json: JsonObject): SoftwareLease {
    return softwareLeaseFromJsonObject(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<SoftwareLease>): HttpParams {
    throw new Error('Method not implemented.');
  }

}