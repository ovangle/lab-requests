import { DOCUMENT } from "@angular/common";
import { Injectable, Inject, Provider, inject, InjectionToken, Pipe } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { LoginContext } from "../oauth/login-context";

export function getResolvedUrl(router: Router, route: ActivatedRoute): string {
    const urlTree = router.createUrlTree(["."], { relativeTo: route });
    return router.serializeUrl(urlTree);
}

@Injectable({providedIn: 'root'})
export class ExternalNavigation {
    readonly document = inject(DOCUMENT);

    get protocol(): string {
        return this.document.location.protocol;
    }

    get host(): string {
        return this.document.location.host;
    }

    get hostname(): string {
        return this.document.location.hostname;
    }

    get port(): string {
        return this.document.location.port;
    }

    go(url: string) {
        this.document.location.href = url;
    }
}

export async function requiresAuthorizationGuard(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Promise<boolean | UrlTree> {
    const router = inject(Router);
    const loginContext = inject(LoginContext);

    const isLoggedIn = await loginContext.checkLoggedIn();
    if (!isLoggedIn) {
        return router.parseUrl('/public')
    }
    return true;
}


