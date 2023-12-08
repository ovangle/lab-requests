import { Component, Injectable, inject } from "@angular/core";
import { LoginContext } from "../oauth/login-context";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { UserMenuComponent } from "../user/common/user-menu.component";
import { AppRoutes } from "../app-routing.module";
import { BehaviorSubject } from "rxjs";

@Injectable({providedIn: 'root'})
export class ScaffoldToolbarControl {
    titleSubject= new BehaviorSubject<string>('HELLO WORLD');

    readonly title = this.titleSubject.asObservable();
}


@Component({
    selector: 'scaffold-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatButtonModule,
        UserMenuComponent
    ],
    template: `
    <div class="logo">
        <img
            width="30"
            alt="Logo"
            src="/assets/android-chrome-192x192.png"
        />
    </div>

    @if (control.title | async; as title) {
        <div class="title">
            {{title}}
        </div>
    }

    <div class="spacer"></div>

    <user-menu 
        [isLoggedIn]="_oauthContext.isLoggedIn" 
        userFullName="Current user"
        [userFeatureLink]="[_appRoutes.user]" />
    `,
    styles: `
    :host {
        display: flex;
        align-items: center;
        padding: 0 1em;
        box-sizing: border-box;
    }

    .logo {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .title {
        padding-left: 1em;
    }

    .spacer {
        flex: 1 0;
    }

    `
})
export class ToolbarComponent {
    _appRoutes = inject(AppRoutes);
    _oauthContext = inject(LoginContext);

    readonly control = inject(ScaffoldToolbarControl);
}