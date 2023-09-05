import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Observable, catchError, map, switchMap } from "rxjs";

import { ModelService } from "src/app/utils/models/model-service";


export type CampusCode = string;
export function isCampusCode(obj: any): obj is CampusCode {
    return typeof obj === 'string' && /^[A-Z]{0,8}$/.test(obj);
}

export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export interface CampusCreate {
    readonly id?: string;
    readonly code?: string;
    readonly name: string;
}

export class Campus {
    readonly id: string;
    readonly code: CampusCode;

    name: string;

    constructor(readonly params: Partial<Campus>) {
        this.id = params.id!;
        this.code = params.code!;
        this.name = params.name!;
    }
}

export function isCampus(obj: any): obj is Campus {
    return obj instanceof Campus;
}

export type CampusForm = FormGroup<{
    code: FormControl<CampusCode>;
    name: FormControl<string>;
}>;

export interface CampusFormValidationErrors extends ValidationErrors {
    code: Readonly<{
        required: string;
        pattern: string
        notUnique: string;
    }>
    name: Readonly<{required: string}>
}

class CampusDoesNotExist extends Error {}

@Injectable()
export class CampusModelService extends ModelService<Campus> {
    override readonly servicePath = '/uni/campuses'
    override modelFromJson(json: object): Campus {
        return new Campus(json);
    }

    searchCampuses(name: string | null): Observable<Campus[]> {
        console.log(`searching campuses where name starts with ${name}`)
        return this.list('', {params: { name_startswith: name || '' }});
    }

    getCampusesByCode(code: string): Observable<Campus[]> {
        return this.list(`/`, {params: {code}});
    }

    protected _validateCodeUnique(control: AbstractControl<string>): Observable<{[k: string]: any} | null> {
        return control.valueChanges.pipe(
            switchMap(value => this.getCampusesByCode(value)), 
            map(campuses => {
                if (campuses.length > 0) {
                    return { notUnique: 'Code is not unique amongst campuses'}
                }
                return null;
            })
        )
    }

    campusForm(campus: Partial<Campus>): CampusForm {
        return new FormGroup({
            code: new FormControl<CampusCode>(
                campus.code || '',
                {
                    nonNullable: true,
                    validators: [
                        Validators.required, 
                        Validators.pattern(/^[_A-Z]{0,8}$/),
                    ],
                    asyncValidators: [
                        (control) => this._validateCodeUnique(control)
                    ]
                }
            ),
            name: new FormControl<string>(
                campus.name || '',
                {nonNullable: true, validators: [Validators.required]}
            )
        });
    }

    commitForm(form: CampusForm): Observable<Campus> {
        if (!form.valid) {
            throw new Error('Cannot commit invalid form');
        }
        return this.create('/campuses', { code: form.value.code!, name: form.value.name! });
    }
}

