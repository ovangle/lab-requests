import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors, AsyncValidatorFn } from "@angular/forms";
import { tap, shareReplay, defer, map, Observable, filter, firstValueFrom, of, catchError, throwError } from "rxjs";
import { Campus, CampusModelService } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { FundingModel, FundingModelCreate, FundingModelService } from "src/app/uni/research/funding-model/funding-model";
import { WorkUnitForm } from "../work-unit/work-unit-form.service";
import { ExperimentalPlanContext, patchFromExperimentalPlan, ExperimentalPlanPatchErrors, ExperimentalPlanPatch, ExperimentalPlan } from "./experimental-plan";
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

function isCampusOrCampusCodeValidator(campuses: CampusModelService): AsyncValidatorFn {
    return function (control: AbstractControl<Campus | string | null>): Observable<ValidationErrors | null> {
        if (control.value instanceof Campus || control.value == null){
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
                    })
                );
            } else {
                return of({'invalidCode': `Invalid campus code ${control.value}`});
            }
        } else {
            throw new Error('Invalid control value');
        }
    }
}

function isFundingModelOrNameValidator(service: FundingModelService): AsyncValidatorFn {
    return function (control: AbstractControl<FundingModel | string | null>): Observable<ValidationErrors | null> {
        const fundingModelService = inject(FundingModelService);

        if (control.value instanceof FundingModel || control.value == null) {
            return of(null);
        } else {
            return fundingModelService.getByName(control.value).pipe(
                map(() => null),
                catchError(err => {
                    if (err instanceof HttpErrorResponse && err.status === 404) {
                        return of({
                            'notAFundingModel': 'Not the name of a funding model'
                        });
                    }
                    return throwError(() => err);
                })
            );
        }
    }
}

export function experimentalPlanForm(): ExperimentalPlanForm {
    const campuses = inject(CampusModelService);
    const fundingModels = inject(FundingModelService);


    return new FormGroup({
        title: new FormControl<string>('', {nonNullable: true, validators: [Validators.required]}),
        researcher: new FormControl<string>('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
        researcherBaseCampus: new FormControl<Campus | string | null>(
            null, 
            { 
                validators: [Validators.required],
                asyncValidators: [isCampusOrCampusCodeValidator(campuses)]
            }
        ),
        researcherDiscipline: new FormControl<Discipline | null>(null, { validators: [Validators.required] }),
        fundingModel: new FormControl<FundingModel | string | null>(
            null, 
            { 
                validators: [Validators.required],
                asyncValidators: [isFundingModelOrNameValidator(fundingModels)]
            }
        ),
        supervisor: new FormControl<string | null>(null, { validators: [Validators.email]}),
        processSummary: new FormControl('', { nonNullable: true }),
        addWorkUnits: new FormArray<WorkUnitForm>([])
    });
}

export function experimentalPlanPatchFromForm(form: ExperimentalPlanForm): Observable<ExperimentalPlanPatch> {
    return form.valueChanges.pipe(
        filter(() => form.valid),
        map(value => form.value as ExperimentalPlanPatch)
    )
}

export function experimentalPlanPatchErrorsFromForm(form: ExperimentalPlanForm): Observable<ExperimentalPlanPatchErrors | null> {
    return form.statusChanges.pipe(
        filter((status) => status === 'INVALID'),
        map(() => form.errors as ExperimentalPlanPatchErrors | null)
    );
}