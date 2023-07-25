import { DOCUMENT } from "@angular/common";
import { Inject, Provider, inject } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { LoginContext } from "../oauth/login-context";

export function getResolvedUrl(router: Router, route: ActivatedRoute): string {
    const urlTree = router.createUrlTree(["."], { relativeTo: route });
    return router.serializeUrl(urlTree);
}

export class ExternalNavigation {
    constructor(
        @Inject(DOCUMENT)
        readonly document: Document
    ) {}

    go(url: string) {
        this.document.location.href = url;
    }
}

export function provideExternalNavigation(): Provider[] {
    return [
        ExternalNavigation
    ];
}

export async function requiresAuthorizationGuard(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Promise<boolean | UrlTree> {
    const loginContext = inject(LoginContext);

    const isLoggedIn = await loginContext.checkLoggedIn();
    if (!isLoggedIn) {
        await loginContext.login();
    }
}