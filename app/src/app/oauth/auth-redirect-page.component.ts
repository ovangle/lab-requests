import { Component, inject } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { LoginError, LoginService } from "./login-service";
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

        <!--
            <button mat-button (click)="clearLoginState()">Reset app state</button>
        -->
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
    readonly _loginService = inject(LoginService);
    readonly activatedRoute = inject(ActivatedRoute);

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

            try {
                await this._loginService.handleExternalAuthorizationRedirect({ authCode, stateToken });
            } catch (err) {
                if (err instanceof LoginError) {
                    this.error = err.message;
                    this.errorDescription = err.description;
                }
                throw err;
            }
        });
    }
}


