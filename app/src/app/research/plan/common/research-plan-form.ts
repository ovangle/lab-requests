import { Injectable, inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
  NgControlStatus,
} from '@angular/forms';
import {
  tap,
  shareReplay,
  defer,
  map,
  Observable,
  filter,
  firstValueFrom,
  of,
  catchError,
  throwError,
  first,
  concatMap,
  merge,
  forkJoin,
  switchMap,
  startWith,
} from 'rxjs';
import { Discipline } from 'src/app/uni/discipline/discipline';
import {
  ResearchFunding,
  ResearchFundingService,
} from 'src/app/research/funding/funding-model';
import {
  WorkUnitForm,
  WorkUnitFormErrors,
  workUnitFormErrors,
} from '../../../lab/work-unit/common/work-unit-form';
import { HttpErrorResponse } from '@angular/common/http';
import { collectFieldErrors } from 'src/app/utils/forms/validators';
import { Campus, CampusService } from 'src/app/uni/campus/common/campus';
import { ResearchPlanPatch } from './research-plan';

export type ExperimentalPlanControls = {
  title: FormControl<string>;

  researcher: FormControl<string>;
  researcherBaseCampus: FormControl<Campus | string | null>;
  researcherDiscipline: FormControl<Discipline | null>;
  fundingModel: FormControl<ResearchFunding | string | null>;

  supervisor: FormControl<string | null>;
  processSummary: FormControl<string>;

  addWorkUnits: FormArray<WorkUnitForm>;
};

export type ExperimentalPlanForm = FormGroup<ExperimentalPlanControls>;

export interface ExperimentalPlanFormErrors {
  title: {
    required: string | null;
  } | null;
  fundingModel: {
    required: string | null;
    notAFundingModel: string | null;
  } | null;
  processSummary: {} | null;
  researcher: {
    email: string | null;
    required: string | null;
  } | null;
  researcherBaseCampus: {
    required: string | null;
    notACampus: string | null;
  } | null;
  researcherDiscipline: {
    required: string | null;
  } | null;

  supervisor: {
    email: string | null;
  } | null;
  addWorkUnits: ReadonlyArray<WorkUnitFormErrors | null>;
}

function isCampusOrCampusCodeValidator(): AsyncValidatorFn {
  const campuses = inject(CampusService);
  return function (
    control: AbstractControl<Campus | string | null>,
  ): Observable<ValidationErrors | null> {
    if (control.value instanceof Campus || control.value == null) {
      return of(null);
    } else if (typeof control.value === 'string') {
      if (/[A-Z]{3}/.test(control.value)) {
        return campuses.getForCode(control.value).pipe(
          map(() => null),
          catchError((err) => {
            if (err instanceof HttpErrorResponse && err.status === 404) {
              return of({
                notACampus: `Campus ${control.value} does not exist`,
              });
            }
            return throwError(() => err);
          }),
          first(),
        );
      } else {
        return of({ invalidCode: `Invalid campus code ${control.value}` });
      }
    } else {
      throw new Error('Invalid control value');
    }
  };
}

function isFundingModelOrNameValidator(): AsyncValidatorFn {
  const fundingModelService = inject(ResearchFundingService);

  return function (
    control: AbstractControl<ResearchFunding | string | null>,
  ): Observable<ValidationErrors | null> {
    return control.valueChanges.pipe(
      switchMap((value) => {
        if (value instanceof ResearchFunding || value == null) {
          return of(null);
        }
        return fundingModelService.getByName(value).pipe(
          map(() => null),
          catchError((err) => {
            if (err instanceof HttpErrorResponse && err.status === 404) {
              return of({
                notAFundingModel: 'Not the name of a funding model',
              });
            }
            throw err;
          }),
        );
      }),
      first(),
    );
  };
}

export function experimentalPlanForm(): ExperimentalPlanForm {
  return new FormGroup(
    {
      title: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      researcher: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      researcherBaseCampus: new FormControl<Campus | string | null>(null, {
        validators: [Validators.required],
        asyncValidators: [isCampusOrCampusCodeValidator()],
      }),
      researcherDiscipline: new FormControl<Discipline | null>(null, {
        validators: [Validators.required],
      }),
      fundingModel: new FormControl<ResearchFunding | string | null>(null, {
        validators: [Validators.required],
        asyncValidators: [isFundingModelOrNameValidator()],
      }),
      supervisor: new FormControl<string | null>(null, {
        validators: [Validators.email],
      }),
      processSummary: new FormControl('', { nonNullable: true }),
      addWorkUnits: new FormArray<WorkUnitForm>([]),
    },
    {
      asyncValidators: [(c) => collectFieldErrors(c as ExperimentalPlanForm)],
    },
  );
}

export function experimentalPlanPatchFromForm(
  form: ExperimentalPlanForm,
): Observable<ResearchPlanPatch> {
  return form.valueChanges.pipe(
    startWith(form.value),
    filter(() => form.valid),
    map((value) => form.value as ResearchPlanPatch),
  );
}

export function experimentalPlanPatchErrorsFromForm(
  form: ExperimentalPlanForm,
): Observable<ExperimentalPlanFormErrors | null> {
  return form.statusChanges.pipe(
    filter((status) => status != 'PENDING'),
    map(() => form.errors as ExperimentalPlanFormErrors | null),
  );
}
