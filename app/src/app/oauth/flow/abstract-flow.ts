import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  firstValueFrom,
  map,
  of,
  throwError,
  timeout,
} from 'rxjs';
import { OauthProviderParams } from '../oauth-provider';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import {
  AccessTokenData,
  AccessTokenResponse,
  accessTokenResponseToAccessTokenData,
} from '../access-token';
import { OauthGrantRequest, OauthGrantType } from '../oauth-grant-type';
import { InvalidCredentials } from '../loigin-error';
import { ExternalNavigation } from 'src/app/utils/router-utils';
import { injectOuauthRedirectUrl } from '../utils';
import {
  OauthFlowState,
  OauthFlowStateParams,
  OauthFlowStateStore,
} from './flow-state-store.service';

export interface OauthFlowEnv {
  readonly externalNavigation: ExternalNavigation;
  readonly httpClient: HttpClient;

  readonly flowStateStore: OauthFlowStateStore;
  readonly authorizationRedirectUrl: string;
}

@Injectable()
export abstract class OauthFlowFactory<GrantType extends OauthGrantType>
  implements OauthFlowEnv
{
  abstract readonly grantType: GrantType;
  abstract get(provider: OauthProviderParams): AbstractOauthFlow<GrantType>;

  readonly externalNavigation = inject(ExternalNavigation);
  readonly httpClient = inject(HttpClient);
  readonly flowStateStore = inject(OauthFlowStateStore);
  readonly authorizationRedirectUrl = injectOuauthRedirectUrl();
}

export abstract class AbstractOauthFlow<
  GrantType extends OauthGrantType,
  GrantRequest extends
    OauthGrantRequest<GrantType> = OauthGrantRequest<GrantType>,
  FlowState extends OauthFlowState<GrantType> = OauthFlowState<GrantType>,
> {
  abstract readonly grantType: GrantType & OauthGrantType;

  readonly providerParams: OauthProviderParams;
  get provider() {
    return this.providerParams.provider;
  }

  readonly externalNavigation: ExternalNavigation;
  readonly httpClient: HttpClient;
  readonly store: OauthFlowStateStore;
  readonly redirectUrl: string;

  constructor(env: OauthFlowEnv, providerParams: OauthProviderParams) {
    this.externalNavigation = env.externalNavigation;
    this.httpClient = env.httpClient;
    this.store = env.flowStateStore;
    this.redirectUrl = env.authorizationRedirectUrl;
    this.providerParams = providerParams;
  }

  get state(): FlowState {
    return this.store.load();
  }

  isInProgress(): boolean {
    return this.store.isFlowInProgress(this.provider, this.grantType);
  }

  abstract generateInitialState(
    params: OauthFlowStateParams<FlowState>,
  ): Promise<FlowState>;

  /**
   * Redirect the application to the login page according to the current state
   *
   * Return the url that is redirected, or `null`.
   */
  abstract redirectToLogin(): string | null;

  abstract isValidGrantRequest(obj: unknown): obj is GrantRequest;
  abstract getGrantRequestBodyParams(request: GrantRequest): URLSearchParams;

  /**
   *
   * @param params
   * @returns
   */
  async fetchToken(params: unknown): Promise<AccessTokenData> {
    if (!this.isValidGrantRequest(params)) {
      throw new Error(
        `Received invalid params for oauth '${this.grantType}' flow`,
      );
    }

    const content = this.getGrantRequestBodyParams(params);

    return firstValueFrom(
      this._postForm<AccessTokenResponse>(
        this.providerParams.tokenUrl,
        content,
      ).pipe(
        map((response: AccessTokenResponse) => {
          return accessTokenResponseToAccessTokenData(
            this.providerParams,
            response,
          );
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            throw InvalidCredentials.fromHttpErrorResponse(err);
          }
          throw err;
        }),
      ),
    );
  }

  protected _postForm<T>(url: string, content: URLSearchParams): Observable<T> {
    return this.httpClient
      .post<T>(url, content.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(timeout(10000));
  }
}
