import { inject } from "@angular/core";
import { FormGroup, FormControl, FormArray, Validators, AbstractControl } from "@angular/forms";
import { Observable, map, share, firstValueFrom } from "rxjs";
import { LabType } from "../type/lab-type";
import { EquipmentPatch, EquipmentPatchErrors, EquipmentModelService, EquipmentContext, Equipment, equipmentPatchFromEquipment } from "./equipment";
import { EquipmentTag } from "./tag/equipment-tag";

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

function equipmentPatchErrorsFromForm(form: EquipmentForm): EquipmentPatchErrors | null {
    if (form.valid) {
        return null;
    }
    return form.errors as EquipmentPatchErrors;
}

export class EquipmentFormService {
    modelService = inject(EquipmentModelService);
    context = inject(EquipmentContext);

    readonly form: EquipmentForm = new FormGroup({
        name: new FormControl<string>(
            '', 
            { 
                nonNullable: true, 
                validators: [Validators.required], 
                asyncValidators: [
                    (c) => this._isEquipmentNameUnique(c)
                ]
            }
        ),
        description: new FormControl<string>('', { nonNullable: true }),
        tags: new FormControl<string[]>([], { nonNullable: true }),
        availableInLabTypes: new FormControl<LabType[] | 'all'>('all', {nonNullable: true}),
        trainingDescriptions: new FormControl<string[]>([], {nonNullable: true})
    });

    readonly patchValue$: Observable<EquipmentPatch | null> = this.form.statusChanges.pipe(
        map(() => equipmentPatchFromForm(this.form)),
        share()
    );
    readonly patchErrors$: Observable<EquipmentPatchErrors | null> = this.form.statusChanges.pipe(
        map(() => equipmentPatchErrorsFromForm(this.form)),
        share()
    );

    get tags() {
        return this.form.controls.tags;
    }

    _isEquipmentNameUnique(nameControl: AbstractControl<string>): Observable<{'notUnique': string} | null> {
        const name = nameControl.value;
        return this.modelService.query({name: name}).pipe(
            map(names => names.length > 0 ? {'notUnique': 'Name is not unique'} : null)
        );
    }

    async commit(): Promise<Equipment> {
        if (!this.form.valid) {
            throw new Error('Cannot commit. Form invalid');
        }
        const patch = equipmentPatchFromForm(this.form);
        return this.context.commit(patch!);
    }

    async reset() {
        const committed = await firstValueFrom(this.context.committed$);
        this.form.reset();
        if (committed) {
            this.form.patchValue(equipmentPatchFromEquipment(committed));
        }
    }
}