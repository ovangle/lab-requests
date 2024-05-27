import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, InjectionToken, Provider, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, switchMap, takeUntil, takeWhile, tap } from 'rxjs';
import { LoginContext } from '../login-context';
import { PUBLIC_PAGE_PATH } from '../utils';

type UrlMatcherFn = (request: HttpRequest<any>) => boolean;

export function baseUrlMatcherFn(
  baseUrl: string,
  ignorePaths?: string[],
): UrlMatcherFn {
  ignorePaths = ignorePaths || [];
  return (request: HttpRequest<any>) => {
    if (!request.url.startsWith(baseUrl)) {
      return false;
    }
    const path = request.url.substring(baseUrl.length);
    return ignorePaths!.every((ignorePath) => !path.startsWith(ignorePath));
  };
}

/**
 * API urls which should be intercepted in order to authorize tokens.
 * Intended to be a multi provider.
 * If a HTTPClient request url starts with any of these urls, the current login status will be
 * checked (and refreshed if necessary), attaching an Authorization header with the currently
 * stored oauth bearer token.
 */
export const AUTHORIZED_API_URL_MATCHER = new InjectionToken<UrlMatcherFn[]>(
  'AUTH_INTERCEPT_URL_MATCHERS',
);

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
  readonly router = inject(Router);
  readonly loginContext = inject(LoginContext);

  readonly publicPagePath = inject(PUBLIC_PAGE_PATH);

  readonly interceptUrlMatchers: UrlMatcherFn[] = inject(
    AUTHORIZED_API_URL_MATCHER,
  );

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const isMatched = this.interceptUrlMatchers.some((matchFn) => matchFn(req));
    if (isMatched) {
      console.log(`A url matcher matched the http request to ${req.url}`);
      console.log('Attaching implicit authorization...');

      return from(this.loginContext.checkLoggedIn()).pipe(
        switchMap((isLoggedIn) => {
          if (isLoggedIn) {
            req = req.clone({
              setHeaders: {
                Authorization: `Bearer ${this.loginContext.currentAccessToken}`,
              },
            });
          }
          return next.handle(req);
        }),
      );
    }

    return next.handle(req);
  }
}

export function provideAuthorizationRequestMatcher(
  matcherFn: UrlMatcherFn,
): Provider {
  return {
    provide: AUTHORIZED_API_URL_MATCHER,
    multi: true,
    useValue: matcherFn,
  };
}

export function authorizationInterceptorProviders(): Provider[] {
  return [
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: AuthorizationInterceptor,
    },
  ];
}
