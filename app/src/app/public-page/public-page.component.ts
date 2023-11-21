import { Component } from "@angular/core";
import { LoginService } from "../oauth/login-service";
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
        <button mat-button (click)="loginContext.loginExternalUser('microsoft')">Login via microsoft</button>
        <a mat-button routerLink="/lab">MyLab</a>
    `
})
export class PublicPageComponent {
    constructor(
        readonly loginContext: LoginService
    ) {}
}