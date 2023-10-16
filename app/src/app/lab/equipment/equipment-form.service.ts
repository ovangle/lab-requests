import { inject } from "@angular/core";
import { FormGroup, FormControl, FormArray, Validators, AbstractControl } from "@angular/forms";
import { Observable, map, share, firstValueFrom } from "rxjs";
import { LabType } from "../type/lab-type";
import { EquipmentTag } from "./tag/equipment-tag";
import { EquipmentPatch, EquipmentContext, Equipment, EquipmentService } from "./common/equipment";

export type EquipmentForm = FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    availableInLabTypes: FormControl<LabType[] | 'all'>;
    tags: FormControl<string[]>,
    trainingDescriptions: FormControl<string[]>;
}>;

export function equipmentPatchFromForm(form: EquipmentForm): EquipmentPatch {
    if (!form.valid) {
        throw new Error('Invalid form has no patch');
    }
    return form.value as EquipmentPatch;
}

export function equipmentForm(): EquipmentForm {
    const equipments = inject(EquipmentService);
    const context = inject(EquipmentContext, {optional: true});

    return new FormGroup({
        name: new FormControl<string>(
            '', 
            { 
                nonNullable: true, 
                validators: [Validators.required], 
                asyncValidators: [
                    (c) => equipmentNameUniqueValidator(c as FormControl<string>)
                ]
            }
        ),
        description: new FormControl<string>('', { nonNullable: true }),
        tags: new FormControl<string[]>([], { nonNullable: true }),
        availableInLabTypes: new FormControl<LabType[] | 'all'>('all', {nonNullable: true}),
        trainingDescriptions: new FormControl<string[]>([], {nonNullable: true})
    });

    function equipmentNameUniqueValidator(control: FormControl<string>): Observable<{'notUnique': string} | null> {
        const name = control.value;
        return equipments.query({name: name}).pipe(
            map(names => names.length > 0 ? {'notUnique': 'Name is not unique'} : null)
        );
    }
}
