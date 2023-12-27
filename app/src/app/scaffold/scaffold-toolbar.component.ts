import { Component, DestroyRef, Injectable, inject } from "@angular/core";
import { LoginContext } from "../oauth/login-context";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { UserMenuComponent } from "../user/common/user-menu.component";
import { AppRoutes } from "../app-routing.module";
import { BehaviorSubject, Observable, ObservableInput, Subscription, distinctUntilChanged, distinctUntilKeyChanged, from, map, of } from "rxjs";

export interface ToolbarState {
    readonly title: string;
    readonly isLoginDisabled: boolean;
}

@Injectable({providedIn: 'root'})
export class ScaffoldToolbarControl {
    readonly _stateSubject = new BehaviorSubject<ToolbarState>({
        title: 'MyLab',
        isLoginDisabled: false
    });

    protected _patchState(state: Partial<ToolbarState>) {
        const current = this._stateSubject.value;
        this._stateSubject.next({...current, ...state});
    }

    protected _getState<K extends keyof ToolbarState>(key: K): Observable<ToolbarState[K]> {
        return this._stateSubject.pipe(
            distinctUntilKeyChanged(key),
            map(state => state[key])
        );
    }

    get title$() {
        return this._getState('title');
    }
    

    setTitle(title: string | ObservableInput<string>): Subscription {
        if (typeof title === 'string') {
            title = of(title);
        } 
        return from(title)
            .subscribe((value) => this._patchState({title: value}))
    }

    get isLoginDisabled$() {
        return this._getState('isLoginDisabled');
    }

    disableLogin(untilDestroyed: DestroyRef) {
        this._patchState({isLoginDisabled: true});
        untilDestroyed.onDestroy(() => {
            this._patchState({isLoginDisabled: false})
        })
    }
}

@Component({
    selector: 'scaffold-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatToolbarModule,
        MatButtonModule,
        
        UserMenuComponent
    ],
    template: `
    <mat-toolbar>
    <div class="logo">
        <img
            width="30"
            alt="Logo"
            src="/assets/android-chrome-192x192.png"
        />
    </div>

    @if (control.title$ | async; as title) {
        <div class="title">
            {{title}}
        </div>
    }

    <div class="spacer"></div>

    <user-menu [userFeatureLink]="[_appRoutes.user]" 
        [isLoggedIn]="_oauthContext.isLoggedIn" 
        [loginDisabled]="control.isLoginDisabled$ | async"
        userFullName="Current user" 
    />
    </mat-toolbar>  
    `,
    styles: `
    :host {
        display: flex;
        align-items: center;
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
    _activatedRoute = inject(ActivatedRoute);

    readonly control = inject(ScaffoldToolbarControl);
}