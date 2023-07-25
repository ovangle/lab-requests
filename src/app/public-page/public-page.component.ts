import { Component } from "@angular/core";
import { LoginContext } from "../oauth/login-context";


@Component({
    selector: 'app-public-page',
    standalone: true,
    template: `
        <button mat-button (click)="loginContext.login('microsoft')">Login via microsoft</button>
    `
})
export class PublicPageComponent {
    constructor(
        readonly loginContext: LoginContext
    ) {}
}