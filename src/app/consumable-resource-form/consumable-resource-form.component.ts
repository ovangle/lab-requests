import { FormControl, FormGroup } from "@angular/forms";


export interface ConsumableResource {

}

export type ConsumableResourceForm = FormGroup<{
    [K in keyof ConsumableResource]: FormControl<K>
}>;

export function createConsumableResourceForm() {

}