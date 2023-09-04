import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, catchError, map, switchMap } from "rxjs";

import { MODEL_BASE_PATH, MODEL_FACTORY, ModelService } from "src/app/utils/models/model-service";


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


class CampusDoesNotExist extends Error {}

@Injectable()
export class CampusService extends ModelService<Campus> {
    searchCampuses(searchString: string): Observable<Campus[]> {
        return this.list('/campuses', { 
            params: { name: searchString }
        });
    }

    getCampusesByCode(code: string): Observable<Campus[]> {
        return this.list(`/campuses`, {params: {code}});
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

export function campusServiceProviders() {
    return [
        { provide: MODEL_FACTORY, useValue: (json: object) => new Campus(json)},
        { provide: MODEL_BASE_PATH, useValue: '/uni' },
        CampusService
    ]
}
