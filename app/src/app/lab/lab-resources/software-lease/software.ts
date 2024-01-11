import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/research/funding/cost-estimate/cost-estimate';
import { resourceFileAttachmentFromJson } from '../../lab-resource/file-attachment/file-attachment';
import { ResourceParams, Resource } from '../../lab-resource/resource';

export interface SoftwareParams extends ResourceParams {
  name: string;
  description: string;

  minVersion: string;

  isLicenseRequired: boolean;
  estimatedCost: CostEstimate | null;
}

export class Software extends Resource<SoftwareParams> {
  override readonly type = 'software-lease';

  name: string;
  description: string;

  minVersion: string;

  isLicenseRequired: boolean;
  estimatedCost: CostEstimate | null;

  constructor(software: SoftwareParams) {
    super(software);

    this.name = software.name || '';
    this.description = software.description || '';
    this.minVersion = software.minVersion || '';

    this.isLicenseRequired = !!software.isLicenseRequired;
    this.estimatedCost = software.estimatedCost;
  }
}

export function softwareFromJson(json: { [k: string]: any }): Software {
  const attachments = Array.from(json['attachments'] || []).map(
    resourceFileAttachmentFromJson,
  );

  return new Software({
    containerId: json['containerId'],
    id: json['id'],
    index: json['index'],
    name: json['name'],
    description: json['description'],
    minVersion: json['minVersion'],
    isLicenseRequired: json['isLicenceRequired'],
    estimatedCost: json['estimatedCost']
      ? costEstimateFromJson(json['estimatedCost'])
      : null,
    attachments,
  });
}

export function softwareParamsToJson(software: SoftwareParams): {
  [k: string]: any;
} {
  return {
    containerId: software.containerId,
    index: software.index,
    name: software.name,
    description: software.description,
    minVersion: software.minVersion,
    isLicenseRequired: software.isLicenseRequired,
    estimatedCost:
      software.estimatedCost && costEstimateToJson(software.estimatedCost),
  };
}
