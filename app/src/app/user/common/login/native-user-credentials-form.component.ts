import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BehaviorSubject, ReplaySubject } from "rxjs";
import { AccessTokenData } from "src/app/oauth/access-token";
import { LoginService } from "src/app/oauth/login-service";
import { InvalidCredentials } from "src/app/oauth/loigin-error";

export interface NativeUserLoginError {
    invalidCredentials: string;
}

@Component({
    selector: 'user-native-user-credentials-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="_onSubmit()">
        <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            
            <mat-error *ngIf="emailErrors?.required">
                A value is required
            </mat-error>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />

            <mat-error *ngIf="passwordErrors?.required">
                A value is required
            </mat-error>
        </mat-form-field>

        <button mat-raised-button type="submit"
                [disabled]="!form.valid">
            Login
        </button>
    </form>

    <div id="login-error-container">
        <ng-container *ngIf="submissionErrors$ | async as responseError">
            Invalid credentials
        </ng-container>
    </div>
    `
})
export class NativeUserCredentialsFormComponent implements OnDestroy {
    readonly _loginService = inject(LoginService);
    protected submissionErrorSubject = new BehaviorSubject<NativeUserLoginError | null>(null);
    readonly submissionErrors$ = this.submissionErrorSubject.asObservable();

    @Output()
    readonly login = new EventEmitter<AccessTokenData>();

    readonly form = new FormGroup(
        {
            email: new FormControl<string>('', {nonNullable: true, validators: Validators.required}),
            password: new FormControl<string>('', {nonNullable: true, validators: Validators.required}),
        }
    );

    ngOnDestroy() {
        this.submissionErrorSubject.complete();
    }

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

    get submissionErrors(): {invalidCredentials: string | null } | null {
        return this.submissionErrorSubject.value;
    }

    async _onSubmit() {
        if (!this.form.valid) {
            throw new Error('Invalid form has no credentials');
        }
        const credentials = {
            username: this.form.value.email!,
            password: this.form.value.password!
        }
        try {
        const accessToken = await this._loginService.loginNativeUser(credentials); 
        } catch (err) {
            if (err instanceof InvalidCredentials) {
                this.submissionErrorSubject.next({invalidCredentials: 'Invalid credentials'});
            }
        }

    }
}