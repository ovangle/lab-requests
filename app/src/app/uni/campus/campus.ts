import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { formatISO, parseISO } from "date-fns";
import { Observable, catchError, firstValueFrom, map, switchMap } from "rxjs";
import { Context } from "src/app/utils/models/model-context";

import { Lookup, ModelService } from "src/app/utils/models/model-service";


export type CampusCode = string;
export function isCampusCode(obj: any): obj is CampusCode {
    return typeof obj === 'string' && /^[A-Z]{0,8}$/.test(obj);
}

export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export class Campus {
    readonly id: string;
    readonly code: CampusCode;

    name: string;

    createdAt: Date;
    updatedAt: Date;

    constructor(params: Campus) {
        this.id = params.id!;
        this.code = params.code!;
        this.name = params.name!;
        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
    }
}

export function isCampus(obj: any): obj is Campus {
    return obj instanceof Campus;
}

export function campusFromJson(json: {[k: string]: any}): Campus {
    return new Campus({
        id: json['id'],
        code: json['code'],
        name: json['name'],
        createdAt: parseISO(json['createdAt']),
        updatedAt: parseISO(json['updatedAt'])
    })
}

export interface CampusPatch {
    code: string;
    name: string;
}

export function campusPatchToJson(patch: CampusPatch) {
    return {code: patch.code, name: patch.name};
}

export type CampusPatchErrors = ValidationErrors & {
    code?: Readonly<{
        required: string | null;
        pattern: string | null;
        notUnique: string | null;
    }>;
    name?: Readonly<{required: string | null}>;
}

export interface CampusLookup extends Lookup<Campus> {
}

function campusLookupToHttpParams(lookup: CampusLookup) {
    return new HttpParams();
}

@Injectable()
export class CampusModelService extends ModelService<Campus, CampusPatch> {
    override readonly resourcePath = '/uni/campuses'
    override readonly modelFromJson = campusFromJson;
    override readonly patchToJson = campusPatchToJson;
    override readonly lookupToHttpParams = campusLookupToHttpParams;

    searchCampuses(name: string | null): Observable<Campus[]> {
        console.log(`searching campuses where name starts with ${name}`);
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
export class CampusContext extends Context<Campus, CampusPatch> {
    
    override readonly models = inject(CampusModelService);
    override _doCreate(request: CampusPatch): Observable<Campus> {
        return this.models.create(request);
    }
    override _doCommit(identifier: string, patch: CampusPatch): Observable<Campus> {
        return this.models.update(identifier, patch);
    }
}

