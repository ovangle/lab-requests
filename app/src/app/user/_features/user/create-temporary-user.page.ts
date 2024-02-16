import { APP_BASE_HREF, CommonModule, Location } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from "@angular/core";
import { CreateTemporaryUserFormComponent } from "../../temporary-user/user-create-temporary-user-form.component";
import { CreateTemporaryUserRequest, CreateTemporaryUserResult, TemporaryAccessUser, User, UserService } from "../../common/user";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { CreateTemporaryUserFlowComponent } from "../../temporary-user/user-temporary-user-flow.component";
import urlJoin from "url-join";
import { HttpParams } from "@angular/common/http";
import { APP_BASE_URL } from "src/app/utils/app-base-url";
import { ShowUrlComponent } from "src/app/common/show-url.component";
import { MatButtonModule } from "@angular/material/button";
// @ts-ignore
import QRCode from 'qrjs';
import { MatIconModule } from "@angular/material/icon";


@Component({
    selector: 'create-temporary-user-page',
    standalone: true,
    imports: [
        CommonModule,
        CreateTemporaryUserFormComponent,
        ShowUrlComponent,
        MatButtonModule,
        MatIconModule
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
                    <common-show-url [url]="userRedirectUrl">
                        <mat-label>Url</mat-label>
                    </common-show-url>
                </div>

            <p> 
                Or save and share the QR code:

                <div class="redirect-qr">
                    <img [attr.src]="qrcodeImgSrc" />

                    <button mat-raised-button (click)="copyImageToClipboard()">
                        <mat-icon>content_paste_go</mat-icon> Copy to clipboard
                    </button>
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
    readonly users = inject(UserService);
    readonly appBaseUrl = inject(APP_BASE_URL);

    result: CreateTemporaryUserResult | undefined;


    get userRedirectUrl() {
        const params = new HttpParams({
            fromObject: {
                id: this.result!.user.id,
                token: this.result!.token
            }
        })
        return `${urlJoin(this.appBaseUrl, 'create-user')}?${params}`;
    }

    get qrcodeImgSrc() {
        const options = { modulesize: 5, margin: 4, unit: 'px', ratio: 1 };
        return QRCode.generatePNG(this.userRedirectUrl, options);
    }

    _onFormSave(request: CreateTemporaryUserRequest) {
        this.users.createTemporaryUser(request).subscribe(result => {
            this.result = result
        });
    }

    copyImageToClipboard() {
        const qrcodeData = atob(this.qrcodeImgSrc.split(',')[1]);
        const blobParts: Uint8Array[] = [];
        for (let offset = 0; offset < qrcodeData.length; offset += 512) {
            const slice = qrcodeData.slice(offset, offset + 512);
            const bytes = new Uint8Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                bytes[i] = slice.charCodeAt(i);
            }
            blobParts.push(bytes);
        }
        const blob = new Blob(blobParts, { type: 'image/png' });
        navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ])
    }

}