import { Component } from "@angular/core";
import { LoginContext } from "../oauth/login-context";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";


@Component({
    selector: 'app-public-page',
    standalone: true,
    imports: [
        RouterModule,
        MatButtonModule,

    ],
    template: `
        <button mat-button (click)="loginContext.login('microsoft')">Login via microsoft</button>

        <a mat-button routerLink="/lab-requests/experimental-plan">Lab requests</a>
    `
})
export class PublicPageComponent {
    constructor(
        readonly loginContext: LoginContext
    ) {}
}