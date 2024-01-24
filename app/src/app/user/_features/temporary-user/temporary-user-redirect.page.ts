import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from "@angular/core";
import { TemporaryAccessUser, injectUserService } from "../../common/user";
import { Observable, defer, first, firstValueFrom, map, shareReplay, switchMap } from "rxjs";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AlterPasswordFormComponent, AlterPasswordRequest } from "../../common/alter-password-form.component";
import { CommonModule } from "@angular/common";


function temporaryUserInfoFromRoute(): Observable<[ TemporaryAccessUser, string ]> {
    const users = injectUserService();
    const route = inject(ActivatedRoute);

    return route.queryParams.pipe(
        first(),
        switchMap(params => {
            const userId = params[ 'id' ];
            if (!userId) {
                throw new Error('No id in route params');
            }
            const token = params[ 'token' ];
            if (!token) {
                throw new Error('No token in route params');
            }
            return users.fetchTemporaryUser(userId, token).pipe(
                map(temporaryUser => [ temporaryUser, token ] as [ TemporaryAccessUser, string ]),
                shareReplay(1)
            )
        })
    )

}

@Component({
    selector: 'user-temporary-user-redirect-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        AlterPasswordFormComponent
    ],
    template: `
    @if (user$ | async; as user) {
        <h1>Welcome, {{ user.name }}</h1>

        @if (user.tokenIsExpired) {
            <p> Your temporary access token has expired. </p>
            <p> Contact the tech involved to issue a new token</p>
        } @else if (user.tokenIsConsumed) {
            <p> The temporary access token has already been used. </p>
            <p> If this wasn't you, contact <a href="email:t.stephenson@cqu.edu.au">the site admin</a></p>
            <p> Otherwise, login <a routerLink="/user/login">here</a>
        } @else {
            <p> Please set a new password </p>

            <user-alter-password-form
                (save)="_onAlterPasswordRequest($event)" />
        }
    }
    `,
})
export class TemporaryUserRedirectPage {
    readonly _router = inject(Router);
    readonly _userService = injectUserService()
    readonly _userInfo = temporaryUserInfoFromRoute();

    readonly user$ = defer(() => this._userInfo.pipe(
        map(([ user ]) => user)
    ));

    readonly accessToken$ = defer(() => this._userInfo.pipe(
        map(([ , token ]) => token)
    ))

    ngOnInit() {
        this._userInfo.subscribe(([ user, token ]) => {
            console.log('user', user, 'token', token);
        })
    }

    async _onAlterPasswordRequest(request: AlterPasswordRequest) {
        const userId = await firstValueFrom(this.user$.pipe(map(user => user.id)));
        const token = await firstValueFrom(this.accessToken$)

        await firstValueFrom(this._userService.finalizeTemporaryUser({
            id: userId,
            token,
            password: request.newValue
        }));

        return await this._router.navigate([ 'user', 'login' ])
    }
}