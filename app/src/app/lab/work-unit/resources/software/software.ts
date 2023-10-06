import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/coste-estimate";
import { Resource, ResourceParams } from "../../resource/resource";
import { ResourceFileAttachment, resourceFileAttachmentFromJson, resourceFileAttachmentToJson } from "../../resource/file-attachment/file-attachment";

export interface SoftwareParams extends ResourceParams<Software> {
    name: string;
    description: string;

    minVersion: string;

    isLicenseRequired: boolean;
    estimatedCost: CostEstimate | null;
}

export class Software implements Resource {
    readonly type = 'software';
    readonly planId: string;
    readonly workUnitId: string;

    readonly index: number | 'create';

    name: string;
    description: string;

    minVersion: string;

    isLicenseRequired: boolean;
    estimatedCost: CostEstimate | null;

    readonly attachments: ResourceFileAttachment<Software>[];

    constructor(software: SoftwareParams) {
        this.planId = software.planId;
        this.workUnitId = software.workUnitId;
        this.index = software.index;

        this.name = software.name || '';
        this.index = software.index!;
        this.description = software.description || '';
        this.minVersion = software.minVersion || '';

        this.isLicenseRequired = !!software.isLicenseRequired;
        this.estimatedCost = software.estimatedCost;
        this.attachments = Array.from(software.attachments || []);
    }
}

export function softwareFromJson(json: {[k: string]: any}): Software {
    const attachments = Array.from(json['attachments'] || [])
        .map(resourceFileAttachmentFromJson);

    return new Software({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        index: json['index'],
        name: json['name'],
        description: json['description'],
        minVersion: json['minVersion'],
        isLicenseRequired: json['isLicenceRequired'],
        estimatedCost: json['estimatedCost'] ? costEstimateFromJson(json['estimatedCost']) : null,
        attachments
    })
}

export function softwareToJson(software: Software): {[k: string]: any} {
    return {
        planId: software.planId,
        workUnitId: software.workUnitId,
        index: software.index,
        name: software.name,
        description: software.description,
        minVersion: software.minVersion,
        isLicenseRequired: software.isLicenseRequired,
        estimatedCost: software.estimatedCost && costEstimateToJson(software.estimatedCost),
        attachments: software.attachments.map(attachment => resourceFileAttachmentToJson(attachment))
    };
}
