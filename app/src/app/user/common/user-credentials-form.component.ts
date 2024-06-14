import { CommonModule, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
  ɵisPromise,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { isJsonObject } from 'src/app/utils/is-json-object';

export interface LoginSuccess {
  accessToken: string;
}

export interface LoginError {
  invalidCredentials: boolean;
}

type LoginResult = LoginSuccess | LoginError;

function isSuccessResult(result: LoginResult): result is LoginSuccess {
  return isJsonObject(result) && typeof result[ 'accessToken' ] === 'string';
}

function isLoginError(obj: unknown): obj is LoginError {
  return (
    typeof obj === 'object' &&
    obj != null &&
    (typeof (obj as any)[ 'invalidCredentials' ] === 'boolean')
  );
}

export class LoginRequest {
  setResultSuccess = (success: LoginSuccess) => { };
  setResultError = (error: LoginError) => { };

  readonly result = new Promise<LoginSuccess>((resolve, reject) => {
    this.setResultSuccess = resolve;
    this.setResultError = reject;
  });

  constructor(
    readonly email: string,
    readonly password: string) {
  }
}

const CQU_EMAIL_PATTERN = /.*@(cqumail.com|cqu.edu.au)$/
function cquEmailValidator(control: AbstractControl<string>) {
  if (!CQU_EMAIL_PATTERN.test(control.value)) {
    return { 'cquEmail': true };
  }
  return null;
}

@Component({
  selector: 'user-credentials-form',
  standalone: true,
  imports: [
    JsonPipe,
    ReactiveFormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="_onSubmit($event)">
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" />

        @if (emailErrors && emailErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
        @if (emailErrors && (emailErrors['email'] || emailErrors['cquEmail'])) {
          <mat-error>Not a valid cqu email address.</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Password</mat-label>
        <input matInput type="password" formControlName="password" />

        @if (passwordErrors && passwordErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <button mat-raised-button type="submit" [disabled]="!form.valid">
        Login
      </button>
    </form>

    @if (_loginErrors) {
      <div id="submission-errors">Invalid credentials</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCredentialsFormComponent {
  _loginErrors: LoginError | null = null;

  @Output()
  readonly loginRequest = new EventEmitter<LoginRequest>();

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        cquEmailValidator
      ]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  get emailErrors(): ValidationErrors | null {
    return this.form.controls.email.errors;
  }

  get passwordErrors(): ValidationErrors | null {
    return this.form.controls.password.errors;
  }

  async _onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!this.form.valid) {
      throw new Error('Invalid form has no credentials');
    }
    const request = new LoginRequest(
      this.form.value.email!,
      this.form.value.password!,
    );
    this.loginRequest.emit(request);
    try {
      const result = await request.result;
      this._loginErrors = null;
      return result;
    } catch (err) {
      if (isLoginError(err)) {
        this._loginErrors = err;
      }
      return null;
    }
  }

  _handleSubmissionResult(result: LoginResult) {
    if (isSuccessResult(result)) {
      this._loginErrors = null;
    } else {
      this._loginErrors = result;
    }
  }
}
