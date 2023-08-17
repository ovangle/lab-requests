import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CollectionViewer } from "@angular/cdk/collections";
import { Observable } from "rxjs";
import { inject } from "@angular/core";
import { Router } from "@angular/router";

import { ResourceTableDataSource } from "../common/resource-table.component";
import { Resource } from "../common/resource";

export class Software implements Resource {
    readonly type: 'software';

    name: string;
    description: string;

    minVersion: string;

    constructor(software?: Partial<Software>) {
        this.name = software?.name || '';
        this.description = software?.description || '';
        this.minVersion = software?.minVersion || '';
    }
}

export type SoftwareForm = FormGroup<{
    type: FormControl<'software'>;
    name: FormControl<string>;
    description: FormControl<string>;
    minVersion: FormControl<string>;
}>;

export function createSoftwareForm(s?: Partial<Software>): SoftwareForm {
    return new FormGroup({
        type: new FormControl('software', {nonNullable: true}),
        name: new FormControl(s?.name || '', { nonNullable: true, validators: [ Validators.required ] }),
        description: new FormControl(s?.description || '', { nonNullable: true }),
        minVersion: new FormControl(s?.minVersion || '', { nonNullable: true })
    });
}


