import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { ModelQuery } from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

import { ResourceParams, Resource, resourceParamsFromJsonObject, ResourcePatch, ResourceService } from '../../resource';
import { Software, softwareFromJsonObject } from '../../../software/software';
import { SoftwareProvision, softwareProvisionFromJsonObject } from '../../../software/provision/software-provision';

export interface SoftwareLeaseParams extends ResourceParams {
  software: Software;
  softwareProvision: SoftwareProvision | null;
}

export class SoftwareLease extends Resource {
  override readonly type = 'software-lease';

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

export interface SoftwareLeasePatch extends ResourcePatch<SoftwareLease> {

}

export function softwareLeasePatchToJsonObject(current: SoftwareLease | null, patch: Partial<SoftwareLeasePatch>): JsonObject {
  return {
    index: current?.index,
  };
}

@Injectable()
export class SoftwareLeaseService extends ResourceService<SoftwareLease, SoftwareLeasePatch> {
  override readonly resourceType = 'software-lease';
  override resourcePatchToJson(current: SoftwareLease | null, patch: Partial<SoftwareLeasePatch>): JsonObject {
    return softwareLeasePatchToJsonObject(current, patch)
  }
  override modelFromJsonObject(json: JsonObject): SoftwareLease {
    return softwareLeaseFromJsonObject(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<SoftwareLease>): HttpParams {
    throw new Error('Method not implemented.');
  }

}