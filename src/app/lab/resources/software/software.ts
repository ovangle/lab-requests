import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Resource } from "../common/resource";

export class Software implements Resource {
    readonly type = 'software';

    name: string;
    description: string;

    minVersion: string;

    isLicenseRequired: boolean;
    estimatedCost: number;

    constructor(software: Partial<Software>) {
        this.name = software.name || '';
        this.description = software.description || '';
        this.minVersion = software.minVersion || '';

        this.isLicenseRequired = !!software.isLicenseRequired;
        this.estimatedCost = software.estimatedCost || 0;
    }
}

export type SoftwareForm = FormGroup<{
    type: FormControl<'software'>;
    name: FormControl<string>;
    description: FormControl<string>;
    minVersion: FormControl<string>;

    isLicenseRequired: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function createSoftwareForm(s: Partial<Software>): SoftwareForm {
    return new FormGroup({
        type: new FormControl('software', {nonNullable: true}),
        name: new FormControl(s.name || '', { nonNullable: true, validators: [ Validators.required ] }),
        description: new FormControl(s.description || '', { nonNullable: true }),
        minVersion: new FormControl(s.minVersion || '', { nonNullable: true }),
        isLicenseRequired: new FormControl(!!s.isLicenseRequired, {nonNullable: true}),
        estimatedCost: new FormControl(s.estimatedCost || 0, {nonNullable: true})
    });
}


