import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, filter, map, startWith } from 'rxjs';
import { Campus } from 'src/app/uni/campus/campus';
import { Discipline } from 'src/app/uni/discipline/discipline';
import { collectFieldErrors } from 'src/app/utils/forms/validators';

import { WorkUnitCollection, WorkUnitPatch } from './work-unit';
import { inject } from '@angular/core';
import { format } from 'date-fns';
import { campusForm } from 'src/app/uni/campus/campus-form.component';
import {
  ResourceContainerFormControls,
  resourceContainerPatchFromForm,
  resourceContainerFormControls,
} from '../../lab-resource/resource-container-control';

export type WorkUnitForm = FormGroup<
  {
    name: FormControl<string>;
    campus: FormControl<Campus | string | null>;
    discipline: FormControl<Discipline | null>;
    technician: FormControl<string>;
    processSummary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
  } & ResourceContainerFormControls
>;

export function workUnitPatchFromForm(form: WorkUnitForm): WorkUnitPatch {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }

  const value = form.value;
  return {
    name: value.name!,
    campus: value.campus!,
    discipline: value.discipline!,
    technician: value.technician!,
    processSummary: value.processSummary!,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
    ...resourceContainerPatchFromForm(form as any),
  };
}

export function workUnitForm(): WorkUnitForm {
  return new FormGroup(
    {
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [ Validators.required ],
      }),
      campus: new FormControl<Campus | string | null>(null, {
        validators: [ Validators.required ],
      }),
      discipline: new FormControl<Discipline | null>(null, {
        validators: [ Validators.required ],
      }),
      technician: new FormControl('', {
        nonNullable: true,
        validators: [ Validators.required, Validators.email ],
      }),
      processSummary: new FormControl('', { nonNullable: true }),

      startDate: new FormControl<Date | null>(null),
      endDate: new FormControl<Date | null>(null),

      ...resourceContainerFormControls(),
    },
    {
      asyncValidators: [
        (control) => collectFieldErrors(control as WorkUnitForm),
      ],
    },
  );
}
