import { resourceFileAttachmentFromJson } from '../../lab-resource/file-attachment/file-attachment';
import { ResourceParams, Resource, resourceParamsFromJsonObject } from '../../lab-resource/resource';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { Software, softwareFromJsonObject } from '../../software/software';
import { SoftwareProvision, softwareProvisionFromJsonObject } from '../../software/provision/software-provision';

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

export function softwareParamsToJson(software: SoftwareLeaseParams): JsonObject {
  return {
    index: software.index,
  };
}