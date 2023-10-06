import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Resource } from "../../resource/resource";
import { ResourceFileAttachment } from "../../resource/file-attachment/file-attachment";


export class Material implements Resource {
    readonly type: 'input-material' | 'output-material';
    readonly planId: string;
    readonly workUnitId: string;
    readonly index: number | 'create';
    readonly attachments: ResourceFileAttachment<any>[];
}

export type MaterialForm = FormGroup<{
    type: FormControl<'input-material' | 'output-material'>,
    [k: string]: AbstractControl<any>
}>


