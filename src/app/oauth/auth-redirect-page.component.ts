import { Component } from "@angular/core";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { FormArray } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Observable, firstValueFrom, from, lastValueFrom, timeout } from "rxjs";
import {add, format, formatISO, isAfter, parseISO} from "date-fns";
import { getResolvedUrl } from "../utils/router-utils";
import { LoginContext } from "./login-context";

@Component({
    selector: 'lab-req-auth-redirect-page',
    standalone: true,
    imports: [
        HttpClientModule,
        RouterModule,
    ],
    template: `
        <p>Redirecting...</p>
    `
})
export class AuthRedirectPageComponent {
    constructor(
        readonly loginContext: LoginContext,
        readonly activatedRoute: ActivatedRoute
    ) { }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe(params => {
            debugger;
        });
    }

}


