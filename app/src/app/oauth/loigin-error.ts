import { HttpErrorResponse } from '@angular/common/http';

export class InvalidCredentials extends Error {
  readonly error: string;
  readonly errorDescription: string;

  static fromHttpErrorResponse(response: HttpErrorResponse) {
    const error = response.error;
    return new InvalidCredentials(error['error'], error['error_description']);
  }

  constructor(error: string, errorDescription: string) {
    super(`${error}: ${errorDescription}`);
    this.error = error;
    this.errorDescription = errorDescription;
  }
}
