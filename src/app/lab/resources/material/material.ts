import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Resource } from "../common/resource";


export class Material implements Resource {
    readonly type: 'input-material' | 'output-material';
}

export type MaterialForm = FormGroup<{
    type: FormControl<'input-material' | 'output-material'>,
    [k: string]: AbstractControl<any>
}>


