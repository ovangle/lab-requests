import { DOCUMENT } from "@angular/common";
import { Injectable, Inject, Provider, inject, InjectionToken, Pipe } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { LoginService } from "../oauth/login-service";

export function getResolvedUrl(router: Router, route: ActivatedRoute): string {
    const urlTree = router.createUrlTree(["."], { relativeTo: route });
    return router.serializeUrl(urlTree);
}

@Injectable()
export class ExternalNavigation {
    constructor(
        @Inject(DOCUMENT)
        readonly document: Document
    ) {}

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

export function provideExternalNavigation(): Provider[] {
    return [
        ExternalNavigation
    ];
}

export async function requiresAuthorizationGuard(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Promise<boolean | UrlTree> {
    const router = inject(Router);
    const loginContext = inject(LoginService);

    if (!loginContext.isInitialized) {
        await loginContext.init();
    }

    const isLoggedIn = await loginContext.checkLoggedIn();
    if (!isLoggedIn) {
        return router.parseUrl('/public')
    }
    return true;
}


