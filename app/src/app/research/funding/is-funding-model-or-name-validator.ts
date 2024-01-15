import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { Observable, switchMap, of, map, catchError, first } from "rxjs";

import { ResearchFundingService, ResearchFunding } from "./research-funding";


export function isFundingModelOrNameValidator(): AsyncValidatorFn {
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
