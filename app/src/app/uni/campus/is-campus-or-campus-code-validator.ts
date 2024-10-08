import { HttpErrorResponse } from "@angular/common/http";
import { AsyncValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";
import { Observable, of, map, catchError, throwError, first } from "rxjs";
import { Campus, injectCampusService } from "./campus";

export function isCampusOrCampusCodeValidator(): AsyncValidatorFn {
  const campuses = injectCampusService();
  return function (
    control: AbstractControl<Campus | string | null>,
  ): Observable<ValidationErrors | null> {
    if (control.value instanceof Campus || control.value == null) {
      return of(null);
    } else if (typeof control.value === 'string') {
      if (/[A-Z]{3}/.test(control.value)) {
        return campuses.lookup({ code: control.value }).pipe(
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