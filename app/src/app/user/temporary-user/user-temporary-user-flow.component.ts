import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CreateTemporaryUserRequest, CreateTemporaryUserResult, User, injectUserService } from "../common/user";
import { APP_BASE_HREF } from "@angular/common";
import { CreateTemporaryUserFormComponent } from "./user-temporary-user-create-form.component";
import { firstValueFrom } from "rxjs";
import { HttpParams } from "@angular/common/http";
import urlJoin from "url-join";


@Component({
    selector: 'user-create-temporary-user',
    standalone: true,
    imports: [
        CreateTemporaryUserFormComponent,
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    template: `
        <div>
            <h4>Create temporary user</h4>
        @if (isSuccess) {
            <p>
                A temporary user has been created {{result!.user.email}}
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
            <user-create-temporary-user-form
                (save)="_onFormSave($event)" />
        }
    </div>
    `
})
export class CreateTemporaryUserFlowComponent {
    readonly _userService = injectUserService();
    readonly appBaseHref = inject(APP_BASE_HREF);

    result: CreateTemporaryUserResult | undefined;

    get isSuccess() {
        return this.result !== undefined;
    }

    @Output()
    userCreated = new EventEmitter<CreateTemporaryUserResult>();

    async _onFormSave(request: CreateTemporaryUserRequest) {
        const result = await firstValueFrom(this._userService.createTemporaryUser(request));
        this.result = result;
        this.userCreated.emit(result);
    }

    get userRedirectUrl() {
        const tempUser = this.result!.user;
        const params = new HttpParams({
            fromObject: { name: tempUser.name, email: tempUser.email, token: this.result!.token }
        });

        return `${urlJoin(this.appBaseHref, 'redirect-temporary-user')}?${params}`;
    }

}