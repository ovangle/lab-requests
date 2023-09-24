import { AbstractControl, ControlContainer, FormArray, FormControl, FormGroup, ValidationErrors } from "@angular/forms";
import { Observable, filter, first, forkJoin, map, of, startWith, switchMap, tap } from "rxjs";

function _collectFormControlErrors(control: FormControl<any>): Observable<ValidationErrors | null> {
    return control.statusChanges.pipe(
        startWith(control.status),
        filter(status => status != 'PENDING'),
        map(() => control.errors),
        first()
    )
}

function _collectFormArrayErrors(arr: FormArray<any>): Observable<{items: (ValidationErrors | null)[]} | null> {
    return arr.statusChanges.pipe(
        startWith(arr.status),
        filter(status => status != 'PENDING'),
        switchMap(status => {
            if (status == 'VALID' || status == 'DISABLED') {
                return of(null);
            }
            const items: Observable<ValidationErrors | null>[] 
                = arr.controls.map((c) => _collectAbstractControlErrors(c))
            console.log('items 0', items)
            return forkJoin(items).pipe(
                map((items) => { return {items}; }),
                tap((items) => console.log('items', items))
            );
        }),
        first()
    );
}

function _collectFormGroupErrors(grp: FormGroup<any>): Observable<ValidationErrors | null> {
    return grp.statusChanges.pipe(
        startWith(grp.status),
        filter(status => status != 'PENDING'),
        switchMap(() => collectFieldErrors(grp)),
        first()
    );
}

function _collectAbstractControlErrors(control: AbstractControl<any>): Observable<ValidationErrors | null> {
    if (control instanceof FormControl) {
        return _collectFormControlErrors(control);
    } else if (control instanceof FormArray) {
        return _collectFormArrayErrors(control);
    } else if (control instanceof FormGroup) {
        return _collectFormGroupErrors(control);
    } else {
        throw new Error(`Unrecognised control type ${control}`);
    }
}

/**
 * Adds an async validator to a form group which collects errors from subcontrols
 * 
 * @param group: FormGroup<any>
 */
export function collectFieldErrors(group: FormGroup<any>): Observable<ValidationErrors | null> {
    if (group.valid) {
        return of(null);
    }
    const formKeys = Object.keys(group.controls);
    const fieldValidities = formKeys.map(k => {
        const control = group.controls[k];
        // console.log(k, 'control status: ', control.status)
        return _collectAbstractControlErrors(group.controls[k]).pipe(
          //  tap(errors => console.log(`${k} errors: ${errors}`))
        )
    });

    return forkJoin(fieldValidities).pipe(
        map(values => { 
            const entries = formKeys
                .map((k, i) => [k, values[i]])
                .filter(([_, v]) => v != null);
            console.log('entries', entries);
            return Object.fromEntries(entries) as ValidationErrors;
        })
    );
}

