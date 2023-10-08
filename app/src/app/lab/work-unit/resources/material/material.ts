import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Resource } from "../../resource/resource";
import { ResourceFileAttachment } from "../../resource/file-attachment/file-attachment";


export class Material extends Resource {
    override readonly type: 'input-material' | 'output-material';
}

export type MaterialForm = FormGroup<{
    type: FormControl<'input-material' | 'output-material'>,
    [k: string]: AbstractControl<any>
}>


