import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors, AsyncValidatorFn, NgControlStatus } from "@angular/forms";
import { tap, shareReplay, defer, map, Observable, filter, firstValueFrom, of, catchError, throwError, first, concatMap, merge, forkJoin, switchMap, startWith } from "rxjs";
import { Campus, CampusModelService } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { FundingModel, FundingModelCreate, FundingModelService } from "src/app/uni/research/funding-model/funding-model";
import { WorkUnitForm, WorkUnitFormErrors, workUnitFormErrors } from "../work-unit/work-unit-form.service";
import { ExperimentalPlanContext, patchFromExperimentalPlan, ExperimentalPlanPatch, ExperimentalPlan } from "./experimental-plan";
import { HttpErrorResponse } from "@angular/common/http";

export type ExperimentalPlanControls = {
    title: FormControl<string>;

    researcher: FormControl<string>;
    researcherBaseCampus: FormControl<Campus | string | null>;
    researcherDiscipline: FormControl<Discipline | null>;
    fundingModel: FormControl<FundingModel | string | null>;

    supervisor: FormControl<string | null>;
    processSummary: FormControl<string>;

    addWorkUnits: FormArray<WorkUnitForm>;
}

export type ExperimentalPlanForm = FormGroup<ExperimentalPlanControls>;

export interface ExperimentalPlanFormErrors {
    title: {
        required: string | null
    } | null;
    fundingModel: {
        required: string | null;
        notAFundingModel: string | null;
    } | null;
    processSummary: {
    } | null;
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

type ErrKey = keyof ExperimentalPlanControls & keyof ExperimentalPlanFormErrors;
const FORM_CONTROL_ERROR_KEYS: readonly ErrKey[] = [
    'title', 'fundingModel', 'processSummary',
    'researcher', 'researcherBaseCampus', 'researcherDiscipline',
    'supervisor',
] as const;
function _isFormControlErrKey(key: ErrKey): key is Exclude<ErrKey, 'addWorkUnits'> {
    return FORM_CONTROL_ERROR_KEYS.includes(key);
}

const FORM_ARRAY_ERROR_KEYS: readonly ErrKey[] = [
    'addWorkUnits'
] as const;
function _isFormArrayErrKey(key: ErrKey): key is 'addWorkUnits' {
    return key === 'addWorkUnits';
}

const FORM_ERR_KEYS = [...FORM_CONTROL_ERROR_KEYS, ...FORM_ARRAY_ERROR_KEYS];

function isCampusOrCampusCodeValidator(): AsyncValidatorFn {
    const campuses = inject(CampusModelService);
    return function (control: AbstractControl<Campus | string | null>): Observable<ValidationErrors | null> {
        if (control.value instanceof Campus || control.value == null) {
            return of(null);
        } else if (typeof control.value === 'string') {
            if (/[A-Z]{3}/.test(control.value)) {
                return campuses.getForCode(control.value).pipe(
                    map(() => null),
                    catchError(err => {
                        if (err instanceof HttpErrorResponse && err.status === 404) {
                            return of({
                                'notACampus': `Campus ${control.value} does not exist`
                            });
                        }
                        return throwError(() => err);
                    }),
                    first()
                );
            } else {
                return of({ 'invalidCode': `Invalid campus code ${control.value}` });
            }
        } else {
            throw new Error('Invalid control value');
        }
    }
}

function isFundingModelOrNameValidator(): AsyncValidatorFn {
    const fundingModelService = inject(FundingModelService);

    return function (control: AbstractControl<FundingModel | string | null>): Observable<ValidationErrors | null> {
        return control.valueChanges.pipe(
            switchMap(value => {
                if (value instanceof FundingModel || value == null) {
                    return of(null);
                }
                return fundingModelService.getByName(value).pipe(
                    map(() => null),
                    catchError(err => {
                        if (err instanceof HttpErrorResponse && err.status === 404) {
                            return of({
                                'notAFundingModel': 'Not the name of a funding model'
                            });
                        }
                        throw err;
                    }),
                );
            }),
            first()
        );
    }
}

export function experimentalPlanForm(): ExperimentalPlanForm {

    function getErrors<K extends ErrKey>(form: ExperimentalPlanForm, key: K): Observable<ExperimentalPlanFormErrors[K]> {
        if (_isFormArrayErrKey(key)) {
            const formArr = form.controls[key] as FormArray<WorkUnitForm>;
            return of(formArr.controls.map(workUnitForm => workUnitFormErrors(workUnitForm)) as any);
        } else if (_isFormControlErrKey(key)) {
            const control: FormControl = form.controls[key];
            if (control.status === 'PENDING') {
                return control.statusChanges.pipe(
                    filter(status => status != 'PENDING'),
                    map(() => control.errors as ExperimentalPlanFormErrors[K]),
                    first()
                );
            }
            return of(control.errors as ExperimentalPlanFormErrors[K]);
        } else {
            throw new Error('Expected an error key')
        }
    }

    function collectErrors(form: ExperimentalPlanForm): Observable<ExperimentalPlanFormErrors | null> {
        const errors = FORM_ERR_KEYS.map(key => getErrors(form, key));
        return forkJoin(errors).pipe(
            map(errors => {
                if (errors.every(err => {
                    if (Array.isArray(err)) {
                        return err.every(item => item == null);
                    }
                    return err == null;
                })) {
                    return null;
                }
                const errEntries = FORM_ERR_KEYS.map((k, i) => [k, errors[i]]);
                return Object.fromEntries(errEntries) as ExperimentalPlanFormErrors;
            })
        );
    }

    return new FormGroup({
        title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        researcher: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        researcherBaseCampus: new FormControl<Campus | string | null>(
            null,
            {
                validators: [Validators.required],
                asyncValidators: [isCampusOrCampusCodeValidator()]
            }
        ),
        researcherDiscipline: new FormControl<Discipline | null>(null, { validators: [Validators.required] }),
        fundingModel: new FormControl<FundingModel | string | null>(
            null,
            {
                validators: [Validators.required],
                asyncValidators: [isFundingModelOrNameValidator()]
            }
        ),
        supervisor: new FormControl<string | null>(null, { validators: [Validators.email] }),
        processSummary: new FormControl('', { nonNullable: true }),
        addWorkUnits: new FormArray<WorkUnitForm>(
            []
        )
    }, {
        asyncValidators: [(c) => collectErrors(c as ExperimentalPlanForm)]
    });
}

export function experimentalPlanPatchFromForm(form: ExperimentalPlanForm): Observable<ExperimentalPlanPatch> {
    return form.valueChanges.pipe(
        startWith(form.value),
        filter(() => form.valid),
        map(value => form.value as ExperimentalPlanPatch)
    )
}


export function experimentalPlanPatchErrorsFromForm(form: ExperimentalPlanForm): Observable<ExperimentalPlanFormErrors | null> {
    return form.statusChanges.pipe(
        filter((status) => status != 'PENDING'),
        map(() => form.errors as ExperimentalPlanFormErrors | null)
    );
}