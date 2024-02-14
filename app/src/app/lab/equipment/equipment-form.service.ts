import { inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Observable, map, share, firstValueFrom } from 'rxjs';
import {
  EquipmentPatch,
  Equipment,
  EquipmentService,
} from '../../equipment/equipment';
import { HttpParams } from '@angular/common/http';
import { EquipmentContext } from '../../equipment/equipment-context';

export type EquipmentForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  tags: FormControl<string[]>;
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
  const context = inject(EquipmentContext, { optional: true });

  return new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
      asyncValidators: [
        (c) => equipmentNameUniqueValidator(c as FormControl<string>),
      ],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    trainingDescriptions: new FormControl<string[]>([], { nonNullable: true }),
  });

  function equipmentNameUniqueValidator(
    control: FormControl<string>,
  ): Observable<{ notUnique: string } | null> {
    const name = control.value;

    return equipments
      .query(new HttpParams({ fromObject: { name: name } }))
      .pipe(
        map((names) =>
          names.length > 0 ? { notUnique: 'Name is not unique' } : null,
        ),
      );
  }
}
