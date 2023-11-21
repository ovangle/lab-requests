import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, from, switchMap, takeUntil, takeWhile, tap } from "rxjs";
import { LoginService } from "./login-service";

type UrlMatcherFn = (request: HttpRequest<any>) => boolean;

/**
 * API urls which should be intercepted in order to authorize tokens.
 * Intended to be a multi provider.
 * If a HTTPClient request url starts with any of these urls, the current login status will be
 * checked (and refreshed if necessary), attaching an Authorization header with the currently
 * stored oauth bearer token.
 */
export const AUTHORIZED_API_URL_MATCHERS = new InjectionToken<UrlMatcherFn[]>('AUTH_INTERCEPT_URL_MATCHERS');

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
    constructor(
        readonly router: Router,
        readonly loginContext: LoginService,

        @Inject(AUTHORIZED_API_URL_MATCHERS)
        readonly interceptUrlMatchers: UrlMatcherFn[]
    ) { }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const isMatched = this.interceptUrlMatchers.some(
            matchFn => matchFn(req)
        );
        if (isMatched) {
            console.log(`A url matcher matched the http request to ${req.url}`);
            console.log('Attaching implicit authorization...')

            return from(this.loginContext.checkLoggedIn()).pipe(
                tap(isLoggedIn => {
                    if (!isLoggedIn) {
                        this.loginContext.clearLocalStorage();
                        this.router.navigateByUrl('/')
                    }
                }),
                takeWhile(isLoggedIn => !isLoggedIn),
                switchMap(() => next.handle(req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${this.loginContext.currentAccessToken}`
                    }
                })))
            )
        }

        return next.handle(req);
    }


}

export function authorizationInterceptorProviders(
    matcherFns?: UrlMatcherFn[]
): Provider[] {
    return [
        ...(matcherFns || []).map(fn => ({
            provide: AUTHORIZED_API_URL_MATCHERS,
            useValue: fn,
            multi: true
        })),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthorizationInterceptor,
            multi: true
        }
    ]
}

export const BASE_API_MATCHERS = [
    (req: HttpRequest<any>) => req.url.startsWith('https://graph.microsoft.com')
]
