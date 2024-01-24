import { APP_BASE_HREF, CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from "@angular/core";
import { CreateTemporaryUserFormComponent } from "../../temporary-user/user-temporary-user-create-form.component";
import { CreateTemporaryUserRequest, CreateTemporaryUserResult, TemporaryAccessUser, injectUserService } from "../../common/user";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { CreateTemporaryUserFlowComponent } from "../../temporary-user/user-temporary-user-flow.component";
import urlJoin from "url-join";
import { HttpParams } from "@angular/common/http";


@Component({
    selector: 'create-temporary-user-page',
    standalone: true,
    imports: [
        CommonModule,
        CreateTemporaryUserFormComponent
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    template: `
    <div>
        <h4>Create student user</h4>
        @if (result) {
            <p>
                A user has been created {{result!.user.email}}
            <p>
                Either: 
                Instruct the user to navigate to 
                <div class="redirect-url"> 
                    {{userRedirectUrl}}
                </div>

            <p> 
                Or save and share the QR code:

                <div class="redirect-qr">
                    <ext-qr-code data="{{userRedirectUrl}}" />
                </div>

            <p>to set their password and finalize their account.
        } @else {
            <user-create-temporary-user-form (save)="_onFormSave($event)" />
        }
    </div>
    `
})
export class CreateTemporaryUserPage {
    readonly _router = inject(Router);
    readonly appBaseHref = inject(APP_BASE_HREF);
    readonly users = injectUserService();

    result: CreateTemporaryUserResult | undefined;

    get userRedirectUrl() {
        const params = new HttpParams({
            fromObject: {
                id: this.result!.user.id,
                token: this.result!.token
            }
        })
        return `${urlJoin(this.appBaseHref)}?${params}`;
    }

    _onFormSave(request: CreateTemporaryUserRequest) {
        debugger;
        this.users.createTemporaryUser(request).subscribe(result => {
            this.result = result
        });
    }

}