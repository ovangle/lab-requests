import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from "@angular/core";
import { injectUserService } from "../../common/user";
import { Observable, firstValueFrom, map } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { AlterPasswordFormComponent, AlterPasswordRequest } from "../../common/alter-password-form.component";
import { CommonModule } from "@angular/common";

interface TemporaryUserInfo {
    token: string;
    name: string;
    email: string;
}

function temporaryUserInfoFromRoute(): Observable<TemporaryUserInfo> {
    const route = inject(ActivatedRoute);

    return route.paramMap.pipe(
        map(params => {
            const token = params.get('token');
            if (!token) {
                throw new Error('No token in route params');
            }
            const name = params.get('name');
            if (!name) {
                throw new Error('No name in route params');
            }

            const email = params.get('email');
            if (!email) {
                throw new Error('No email in route params');
            }
            return { token, name, email };
        })
    )

}

@Component({
    selector: 'user-temporary-user-redirect-page',
    standalone: true,
    imports: [
        CommonModule,
        AlterPasswordFormComponent
    ],
    template: `
    @if (_userInfo | async; as userInfo) {
        <h1>Welcome, {{userInfo.name}}</h1>

        <user-alter-password-form
            (alterPasswordRequest)="_onAlterPasswordRequest($event)"/>
    }
    `,
})
export class TemporaryUserRedirectPage {
    readonly _userService = injectUserService()
    readonly _userInfo = temporaryUserInfoFromRoute();

    async _onAlterPasswordRequest(request: AlterPasswordRequest) {
        const userInfo = await firstValueFrom(this._userInfo);

        const user = await firstValueFrom(this._userService.finalizeTemporaryUser({
            email: userInfo.email,
            token: userInfo.token,
            password: request.newValue
        }));
    }
}