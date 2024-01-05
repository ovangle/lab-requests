import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, filter, map, startWith } from 'rxjs';
import { Campus } from 'src/app/uni/campus/common/campus';
import { Discipline } from 'src/app/uni/discipline/discipline';
import { collectFieldErrors } from 'src/app/utils/forms/validators';
import { LabType } from '../../type/lab-type';
import {
  ResourceContainerForm,
  ResourceContainerFormControls,
  ResourceContainerFormErrors,
  resourceContainerFormControls,
  resourceContainerPatchFromForm,
} from '../resource/resource-container-form.service';
import { WorkUnitCollection, WorkUnitPatch } from './work-unit';
import { inject } from '@angular/core';
import { format } from 'date-fns';
import { campusForm } from 'src/app/uni/campus/campus-form.component';

export type WorkUnitForm = FormGroup<
  {
    name: FormControl<string>;
    campus: FormControl<Campus | string | null>;
    labType: FormControl<Discipline | null>;
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
    labType: value.labType!,
    technician: value.technician!,
    processSummary: value.processSummary!,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
    ...resourceContainerPatchFromForm(form as any),
  };
}

export interface WorkUnitFormErrors extends ResourceContainerFormErrors {
  name: {
    required: string | null;
    notUniqueForPlan: string | null;
  } | null;
  campus: {
    notACampus: string | null;
    required: string | null;
  } | null;
  labType: {
    required: string | null;
  } | null;
  technician: {
    required: string | null;
    email: string | null;
  } | null;
  startDate: {} | null;
  endDate: {} | null;
}

type ErrKey = keyof WorkUnitForm['controls'] & keyof WorkUnitFormErrors;

export function workUnitFormErrors<TKey extends ErrKey>(
  form: WorkUnitForm,
  field: TKey,
): WorkUnitFormErrors[TKey] | null {
  const control = form.controls[field];
  return control.errors as WorkUnitFormErrors[TKey] | null;
}

export function workUnitForm(): WorkUnitForm {
  return new FormGroup(
    {
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      campus: new FormControl<Campus | string | null>(null, {
        validators: [Validators.required],
      }),
      labType: new FormControl<LabType | null>(null, {
        validators: [Validators.required],
      }),
      technician: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
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
