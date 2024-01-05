import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { OauthFeatureModule } from '../_features/oauth.feature-module';
import { OauthProviderParams, OAUTH_PROVIDER_PARAMS } from '../oauth-provider';
import {
  PUBLIC_PAGE_PATH,
  OAUTH_FEATURE_PATH,
  USER_HOME_PAGE_DEFAULT,
} from '../utils';
import { HttpClientModule } from '@angular/common/http';
import { authorizationInterceptorProviders } from './auth-interceptor';

@NgModule({
  imports: [HttpClientModule],
})
export class OauthRootModule {
  static forRoot(
    routes: {
      publicPage: string;
      defaultUserHomePage: string;
      oauthFeature: string;
    },
    providerParams:
      | OauthProviderParams[]
      | InjectionToken<OauthProviderParams[]>,
  ): ModuleWithProviders<OauthRootModule> {
    const paramsProvider = Array.isArray(providerParams)
      ? { provide: OAUTH_PROVIDER_PARAMS, useValue: providerParams }
      : { provide: OAUTH_PROVIDER_PARAMS, useExisting: providerParams };

    return {
      ngModule: OauthFeatureModule,
      providers: [
        paramsProvider,
        { provide: PUBLIC_PAGE_PATH, useValue: routes.publicPage },
        {
          provide: USER_HOME_PAGE_DEFAULT,
          useValue: routes.defaultUserHomePage,
        },
        { provide: OAUTH_FEATURE_PATH, useValue: routes.oauthFeature },
        ...authorizationInterceptorProviders(),
      ],
    };
  }
}
