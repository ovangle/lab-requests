import { Component, Directive, inject, Injectable } from "@angular/core";
import { AsyncSubject, BehaviorSubject, debounceTime, distinctUntilChanged, firstValueFrom, map, Observable, of, shareReplay, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { Software, SoftwareService } from "./software";
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from "@angular/forms";
import { ModelRef } from "../common/model/model";
import { SoftwareContext } from "./software-context";


@Directive({
    selector: '[validateSoftwareNameUnique]',
    standalone: true,
    providers: [
        { provide: NG_ASYNC_VALIDATORS, useExisting: SoftwareNameUniqueValidator, multi: true}
    ]
})
export class SoftwareNameUniqueValidator implements AsyncValidator {

    readonly softwareService = inject(SoftwareService);
    readonly nameSubject = new Subject<string>();

    readonly nameMatches = this.nameSubject.pipe(
        distinctUntilChanged(),
        debounceTime(300),
        switchMap(name => {
            return this.softwareService.queryPage({name})
        }),
        map((page) => {
            if (page.totalItemCount >= 1) {
                return { unique: 'name must be unique'}
            }
            return null;
        }),
        tap(() => this._onValidatorChange()),
        shareReplay(1)
    )

    validate(control: AbstractControl): Promise<ValidationErrors | null> {
        this.nameSubject.next(control.value);
        return firstValueFrom(this.nameMatches);
    }

    _onValidatorChange = () => {};
    registerOnValidatorChange?(fn: () => void): void {
        this._onValidatorChange = fn;
    }
}