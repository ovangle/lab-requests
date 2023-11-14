import { Injectable, inject } from "@angular/core";
import { ModelContext } from "../common/model/context";
import { User, UserPatch, UserService, UserCollection, UserLoginRequest, isNativeUserLoginRequest } from "./user";
import { BehaviorSubject, firstValueFrom, of, tap } from "rxjs";
import { injectModelUpdate } from "../common/model/model-collection";
import { Role } from "./role";
import { LoginContext } from "../oauth/login-context";



@Injectable({providedIn: 'root'})
export class UserContext extends ModelContext<User, UserPatch> {
    readonly userService = inject(UserService);
    readonly loginContext = inject(LoginContext);
    override readonly _doUpdate = injectModelUpdate(UserService, UserCollection);

    readonly user = new BehaviorSubject<User | null>(null);

    constructor() {
        super();

        if (this.loginContext.currentAccessToken != null) {
            this.userService.me().subscribe(me => {
                this.user.next(me);
            })
        }
    }

    async fetchUser(): Promise<User> {
        return await firstValueFrom(this.userService.me().pipe(
            tap((user) => this.user.next(user))
        ));
    }

    async login(request: UserLoginRequest): Promise<User> {
        if (this.user.value != null) {
            return Promise.resolve(this.user.value);
        }
        if (isNativeUserLoginRequest(request)) {
            const user = await firstValueFrom(this.userService.me());
            this.user.next(user);
            return user;
        }
        throw new Error('not implemented');
        // await this.loginContext.login(request);
        // return await this.fetchUser();
    }

    logout() {
        throw new Error('not implemented');
    }

    async hasRole(role: Role): Promise<boolean> {
        return (await firstValueFrom(this.committed$)).hasRole(role);
    }
}