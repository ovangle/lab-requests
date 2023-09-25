import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Resource } from "../../resource/resource";


export class Material implements Resource {
    readonly type: 'input-material' | 'output-material';
    readonly planId: string;
    readonly workUnitId: string;
    readonly index: number | 'create';
}

export type MaterialForm = FormGroup<{
    type: FormControl<'input-material' | 'output-material'>,
    [k: string]: AbstractControl<any>
}>


