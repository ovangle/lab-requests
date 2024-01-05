import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Injectable,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { AlterPassword, AlterPasswordError, User, UserService } from './user';

type AlterPasswordForm = FormGroup<{
  currentValue: FormControl<string>;
  newValue: FormControl<string>;
  newValueAgain: FormControl<string>;
}>;

function sameValueForNewPasswordValidator(
  newValueAgainControl: FormControl<string>,
) {
  if (newValueAgainControl.parent == null) {
    return null;
  }
  const { newValue } = newValueAgainControl.parent.value;
  const newValueAgain = newValueAgainControl.value;
  console.log('new value', newValue, 'again', newValueAgain);
  if (newValue !== newValueAgain) {
    return { sameNewValue: 'different values for newValue' };
  }
  return null;
}

function createCurrentPasswordValidator(
  resultErrors: Observable<AlterPasswordError | null>,
): AsyncValidatorFn {
  return async () => {
    const error = await firstValueFrom(resultErrors);
    console.group('result error', error);
    return (
      error && {
        incorrectForUser: 'current password is incorrect for user',
      }
    );
  };
}

export class AlterPasswordRequest implements AlterPassword {
  _result: Promise<User>;
  setSuccess: (user: User) => void;
  setFailure: (err: any) => void;

  constructor(
    readonly currentValue: string,
    readonly newValue: string,
  ) {
    this._result = new Promise<User>((resolve, reject) => {
      this.setSuccess = resolve;
      this.setFailure = reject;
    });
  }

  result(): Promise<User> {
    return this._result;
  }
}

@Component({
  selector: 'user-alter-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="_handleSubmit($event)">
      <mat-form-field>
        <mat-label>Current password</mat-label>
        <input
          matInput
          type="password"
          formControlName="currentValue"
          required
        />

        @if (currentValueErrors?.required) {
          <mat-error>A value is required</mat-error>
        }

        @if (currentValueErrors?.incorrectForCurrentUser) {
          <mat-error>Incorrect for current user</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>New password</mat-label>
        <input matInput type="password" formControlName="newValue" required />

        @if (newValueErrors?.required) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>New password (again)</mat-label>
        <input
          matInput
          type="password"
          formControlName="newValueAgain"
          required
        />

        @if (newValueAgainErrors?.required) {
          <mat-error>A value is required</mat-error>
        }

        @if (newValueAgainErrors?.sameNewValue) {
          <mat-error>Values must match</mat-error>
        }
      </mat-form-field>

      <button mat-button type="submit"><mat-icon>save</mat-icon>Save</button>
    </form>
  `,
})
export class AlterPasswordFormComponent {
  readonly _resultSuccess = new BehaviorSubject<boolean>(false);
  _clearResultSuccess() {
    this._resultSuccess.next(false);
  }
  _setResultSuccess(_: User) {
    this._resultSuccess.next(true);
  }

  readonly _resultFailure = new BehaviorSubject<AlterPasswordError | null>(
    null,
  );
  _clearResultFailure() {
    this._resultFailure.next(null);
  }
  _setResultFailure(failure: AlterPasswordError) {
    this._resultFailure.next(failure);
  }

  readonly form: AlterPasswordForm = new FormGroup({
    currentValue: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
      asyncValidators: [createCurrentPasswordValidator(this._resultFailure)],
    }),
    newValue: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newValueAgain: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        (control: AbstractControl) =>
          sameValueForNewPasswordValidator(control as FormControl<string>),
      ],
    }),
  });

  @Output()
  alterPasswordRequest = new EventEmitter<AlterPasswordRequest>();

  ngOnInit() {
    this.form.valueChanges.subscribe(() => this._clearResultSuccess());
  }

  ngOnDestroy() {
    this._resultSuccess.complete();
    this._resultFailure.complete();
  }

  get currentValueErrors(): {
    required: string | null;
    incorrectForCurrentUser: string | null;
  } | null {
    const control = this.form.controls.currentValue;
    return (
      control.errors && {
        required: control.errors['required'],
        incorrectForCurrentUser: control.errors['incorrectForCurrentUser'],
      }
    );
  }

  get newValueErrors(): {
    required: string | null;
  } | null {
    const control = this.form.controls.newValue;
    return (
      control.errors && {
        required: control.errors['required'],
      }
    );
  }

  get newValueAgainErrors(): {
    required: string | null;
    sameNewValue: string | null;
  } | null {
    const control = this.form.controls.newValueAgain;
    return (
      control.errors && {
        required: control.errors['required'],
        sameNewValue: control.errors['sameNewValue'],
      }
    );
  }

  async _handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.form.valid) {
      throw new Error('Invalid form has no value');
    }
    this._clearResultFailure();

    const request = new AlterPasswordRequest(
      this.form.value.currentValue!,
      this.form.value.newValue!,
    );
    try {
      const user = await request.result();
      return this._setResultSuccess(user);
    } catch (err) {
      if (err instanceof AlterPasswordError) {
        return this._setResultFailure(err);
      }
      throw err;
    }
  }
}
