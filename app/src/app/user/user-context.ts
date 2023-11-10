import { Injectable, inject } from "@angular/core";
import { ModelContext } from "../common/model/context";
import { User, UserPatch, UserService, UserCollection } from "./user";
import { firstValueFrom } from "rxjs";
import { injectModelUpdate } from "../common/model/model-collection";
import { Role } from "./role";
import { LoginContext } from "../oauth/login-context";



@Injectable({providedIn: 'root'})
export class UserContext extends ModelContext<User, UserPatch> {
    override readonly _doUpdate = injectModelUpdate(UserService, UserCollection);

    constructor(
        loginContext: LoginContext,
    ) {
        const userService = inject(UserService);

        this.loginContext.currentAccessToken$.pipe(
            filter(token => token != null),
            switchMap(userService => userService.me())
        )

    }

    async hasRole(role: Role): Promise<boolean> {
        return (await firstValueFrom(this.committed$)).hasRole(role);
    }
}