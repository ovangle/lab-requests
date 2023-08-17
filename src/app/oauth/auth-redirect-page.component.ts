import { Component } from "@angular/core";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { FormArray } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Observable, firstValueFrom, from, lastValueFrom, timeout } from "rxjs";
import {add, format, formatISO, isAfter, parseISO} from "date-fns";
import { getResolvedUrl } from "../utils/router-utils";
import { LoginContext, isAccessTokenResponse } from "./login-context";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: 'lab-req-auth-redirect-page',
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        MatButtonModule,
        RouterModule,
    ],
    template: `
        <ng-container *ngIf="!error; else errorDisplay">
            <p>Redirecting...</p>
        </ng-container>

        <ng-template #errorDisplay>
            <div class="error-info">
                <h2>
                    An error occurred: ({{error}})
                </h2>

                <p>
                    {{errorDescription}}
                </p>

            </div>
        </ng-template>

        <button mat-button (click)="clearLoginState()">Reset app state</button>
        <a mat-button routerLink="/">Return home</a>
    `,
    styles: [
        `
            .error-info {
                margin-left: 1em;
                max-width: 1000px;
            }
        `

    ]
})
export class AuthRedirectPageComponent {
    constructor(
        readonly loginContext: LoginContext,
        readonly activatedRoute: ActivatedRoute
    ) { }

    error: string | null;
    errorDescription: string | null;

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe(async (params) => {
            if (Object.keys(params).includes('error')) {
                this.error = params['error'];
                this.errorDescription = params['error_description']
                console.log('Oauth returned error:', params['error']);
                console.log('Description\n\n', params['error_description']);
                return;
            }
            const authCode = params['code'];
            const stateToken = params['state'];

            const response = await this.loginContext.finalizeLogin(authCode, stateToken);
            if (!isAccessTokenResponse(response)) {
                this.error = response.error
                this.errorDescription = response.error_description;
                return;
            }
            this.loginContext.restorePreviousRoute();
        });
    }

    clearLoginState() {
        this.loginContext.clearLocalStorage();
    }

}


