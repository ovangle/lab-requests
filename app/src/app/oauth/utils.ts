import { PlatformLocation, Location } from '@angular/common';
import { Injectable, InjectionToken, Provider, inject } from '@angular/core';
import { Router } from '@angular/router';
import urlJoin from 'url-join';
import { OauthFlowStateStore } from './flow/flow-state-store.service';

export function oauthScopeToQueryParam(scopes: string[]) {
  return encodeURIComponent(scopes.join(' '));
}

export function oauthScopeFromQueryParam(rawScope: string): string[] {
  return decodeURIComponent(rawScope).split(' ');
}

export const OAUTH_FEATURE_PATH = new InjectionToken<string>(
  'OAUTH_FEATURE_PATH',
);

export function injectOuauthRedirectUrl(): string {
  const platformLocation = inject(PlatformLocation);
  const location = inject(Location);
  const oauthFeaturePath: string = inject(OAUTH_FEATURE_PATH);

  let isDefaultPortForProtocol = false;
  switch (platformLocation.protocol) {
    case 'http:':
      isDefaultPortForProtocol = platformLocation.port === '80';
      break;
    case 'https:':
      isDefaultPortForProtocol = platformLocation.port === '443';
      break;
  }

  const host =
    platformLocation.hostname +
    (isDefaultPortForProtocol ? '' : `:${platformLocation.port}`);

  const baseUrl = `${platformLocation.protocol}//${host}`;
  return (
    baseUrl + location.prepareExternalUrl(urlJoin(oauthFeaturePath, 'redirect'))
  );
}

export const USER_HOME_PAGE_DEFAULT = new InjectionToken<string>(
  'USER_HOME_PAGE_DEFAULT',
);

export function injectRedirectToUserHomePage(): () => Promise<boolean> {
  const router = inject(Router);
  const flowStateStore = inject(OauthFlowStateStore);
  const defaultUserHomePage = inject(USER_HOME_PAGE_DEFAULT, {
    optional: true,
  });

  return async () => {
    const state = flowStateStore.load();
    let urlToRestore: string | undefined;
    if (state.restoreRoute) {
      urlToRestore = state.restoreRoute;
    }
    if (!urlToRestore && defaultUserHomePage) {
      urlToRestore = defaultUserHomePage;
    }
    if (!urlToRestore) {
      throw new Error(
        'No route to restore in oauth flow state and no USER_HOME_PAGE_DEFAULT provided',
      );
    }
    return await router.navigateByUrl(urlToRestore);
  };
}

export const PUBLIC_PAGE_PATH = new InjectionToken<string>('PUBLIC_PAGE_PATH');

export function injectRedirectToPublic(): () => Promise<boolean> {
  const router = inject(Router);
  const publicPagePath = inject(PUBLIC_PAGE_PATH);

  return async function () {
    return router.navigateByUrl(publicPagePath);
  };
}
