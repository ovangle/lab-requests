import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { ModelQuery } from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

import { ResourceParams, Resource, resourceParamsFromJsonObject, ResourcePatch, ResourceService, resourcePatchToJsonObject } from '../../resource';
import { Software, softwareFromJsonObject } from '../../../software/software';
import { SoftwareProvision, softwareProvisionFromJsonObject } from '../../../software/provision/software-provision';

export interface SoftwareLeaseParams extends ResourceParams {
  software: Software;
  softwareProvision: SoftwareProvision | null;
}

export class SoftwareLease extends Resource {
  override readonly type = 'software_lease';

  software: Software;
  softwareProvision: SoftwareProvision | null;

  constructor(params: SoftwareLeaseParams) {
    super(params);

    this.software = params.software;
    this.softwareProvision = params.softwareProvision;
  }
}

export function softwareLeaseFromJsonObject(json: JsonObject): SoftwareLease {
  const resourceParams = resourceParamsFromJsonObject(json);

  if (!isJsonObject(json[ 'software' ])) {
    throw new Error("Expected a json object 'software'")
  }
  const software = softwareFromJsonObject(json[ 'software' ]);

  if (!isJsonObject(json[ 'softwareProvision' ]) && json[ 'softwareProvision' ] !== null) {
    throw new Error("Expected a json object or null 'softwareProvision'");
  }
  const softwareProvision = json[ 'softwareProvision' ] && softwareProvisionFromJsonObject(json[ 'softwareProvision' ]);

  return new SoftwareLease({
    ...resourceParams,
    software,
    softwareProvision
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