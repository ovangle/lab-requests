import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Resource, ResourceParams } from "../../resource/resource";

export interface SoftwareParams extends ResourceParams<Software> {}

export class Software implements Resource {
    readonly type = 'software';
    readonly planId: string;
    readonly workUnitId: string;

    readonly index: number | 'create';

    name: string;
    description: string;

    minVersion: string;

    isLicenseRequired: boolean;
    estimatedCost: number;

    constructor(software: SoftwareParams) {
        this.planId = software.planId;
        this.workUnitId = software.workUnitId;
        this.index = software.index;

        this.name = software.name || '';
        this.index = software.index!;
        this.description = software.description || '';
        this.minVersion = software.minVersion || '';

        this.isLicenseRequired = !!software.isLicenseRequired;
        this.estimatedCost = software.estimatedCost || 0;
    }
}

export function softwareFromJson(json: {[k: string]: any}): Software {
    return new Software({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        index: json['index'],
        name: json['name'],
        description: json['description'],
        minVersion: json['minVersion'],
        isLicenseRequired: json['isLicenceRequired'],
        estimatedCost: json['estimatedCost']
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
        estimatedCost: software.estimatedCost
    };
}

export type SoftwareForm = FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    minVersion: FormControl<string>;

    isLicenseRequired: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function createSoftwareForm(s: Partial<Software>): SoftwareForm {
    return new FormGroup({
        name: new FormControl(s.name || '', { nonNullable: true, validators: [ Validators.required ] }),
        description: new FormControl(s.description || '', { nonNullable: true }),
        minVersion: new FormControl(s.minVersion || '', { nonNullable: true }),
        isLicenseRequired: new FormControl(!!s.isLicenseRequired, {nonNullable: true}),
        estimatedCost: new FormControl(s.estimatedCost || 0, {nonNullable: true})
    });
}

export type SoftwareFormErrors = ValidationErrors & {
    name?: { required: string | null };
};


