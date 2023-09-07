import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Observable, catchError, firstValueFrom, map, switchMap } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

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

export interface CampusPatch {
    code: CampusCode;
    name: string;
}


export type CampusPatchErrors = ValidationErrors & {
    code?: Readonly<{
        required: string | null;
        pattern: string | null;
        notUnique: string | null;
    }>;
    name?: Readonly<{required: string | null}>;
}

class CampusDoesNotExist extends Error {}

@Injectable()
export class CampusModelService extends ModelService<Campus, CampusPatch> {
    override readonly resourcePath = '/uni/campuses'
    override modelFromJson(json: object): Campus {
        return new Campus(json);
    }

    searchCampuses(name: string | null): Observable<Campus[]> {
        console.log(`searching campuses where name starts with ${name}`)
        return this.query({ name_startswith: name || '' });
    }

    getCampusesByCode(code: string): Observable<Campus[]> {
        return this.query({params: {code}});
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

    

}

@Injectable()
export abstract class CampusContext extends Context<Campus, CampusPatch> {
    override readonly models = inject(CampusModelService);
    override create(patch: CampusPatch): Promise<Campus> {
        return firstValueFrom(this.models.create(patch));
    }

}

