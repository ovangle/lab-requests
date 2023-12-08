import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, inject, ɵisPromise } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { isJsonObject } from "src/app/utils/is-json-object";

export interface LoginSuccess {
    accessToken: string;
}

export interface LoginError {
    invalidCredentials: string | null;
}

type LoginResult = LoginSuccess | LoginError;

function isSuccessResult(result: LoginResult): result is LoginSuccess {
    return isJsonObject(result) && typeof result['accessToken'] === 'string';
}

function isLoginError(obj: unknown): obj is LoginError {
    return (typeof obj === 'object' && obj != null) 
        && (typeof (obj as any)['invalidCredentials'] === 'string' || (obj as any)['invalidCredentials'] === null);
}


export class LoginRequest {
    readonly email: string;
    readonly password: string;
    readonly _result: Promise<LoginSuccess>;

    result(): Promise<LoginSuccess> { return this._result; }

    setResultSuccess: (result: LoginSuccess) => void;
    setResultError: (result: LoginError) => void;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;

        this._result = new Promise((resolve, reject) => {
            this.setResultSuccess = (value: LoginSuccess) => resolve(value);
            this.setResultError = (value: LoginError) => reject(value);
        })
    }

}

@Component({
    selector: 'user-credentials-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="_onSubmit($event)">
        <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            
            @if (emailErrors?.required) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />

            @if (passwordErrors?.required) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <button mat-raised-button type="submit"
                [disabled]="!form.valid">
            Login
        </button>
    </form>

    @if (_loginErrors) {
        <div id="submission-errors">Invalid credentials</div>
    }
    `
})
export class UserCredentialsFormComponent {
    _loginErrors: LoginError | null;

    @Output()
    readonly loginRequest = new EventEmitter<LoginRequest>();
    
    readonly form = new FormGroup(
        {
            email: new FormControl<string>('', {nonNullable: true, validators: Validators.required}),
            password: new FormControl<string>('', {nonNullable: true, validators: Validators.required}),
        }
    );

    get emailErrors(): {required: string | null} | null {
        return this.form.errors 
            ? this.form.controls['email'].errors as ({required: string | null } | null)
            : null;
    }

    get passwordErrors(): {required: string | null} | null {
        return this.form.errors 
            ? this.form.controls['password'].errors as ({required: string | null} | null)
            : null;
    }

    async _onSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (!this.form.valid) {
            throw new Error('Invalid form has no credentials');
        }
        const request = new LoginRequest(this.form.value.email!, this.form.value.password!);
        this.loginRequest.emit(request);
        try {
            const result = await request._result;
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