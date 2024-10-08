import { isJsonObject } from 'src/app/utils/is-json-object';
import { OauthGrantRequest, OauthGrantType } from '../oauth-grant-type';
import { OauthProviderParams } from '../oauth-provider';
import { oauthScopeToQueryParam } from '../utils';
import {
  AbstractOauthFlow,
  OauthFlowEnv,
  OauthFlowFactory,
} from '../flow/abstract-flow';
import { Injectable } from '@angular/core';

export interface ResourceOwnerPasswordGrantRequest
  extends OauthGrantRequest<'password'> {
  username: string;
  password: string;
}

function isResourceOwnerPasswordGrantRequest(
  obj: unknown,
): obj is ResourceOwnerPasswordGrantRequest {
  return (
    isJsonObject(obj) &&
    typeof obj['username'] === 'string' &&
    typeof obj['password'] === 'string'
  );
}

export class ResourceOwnerPasswordCredentialsFlow extends AbstractOauthFlow<
  'password',
  ResourceOwnerPasswordGrantRequest
> {
  override readonly grantType: 'password' = 'password';

  override generateInitialState() {
    return Promise.resolve({
      provider: this.provider,
      grantType: this.grantType,
    });
  }

  override redirectToLogin() {
    return null;
  }

  override getGrantRequestBodyParams(
    request: ResourceOwnerPasswordGrantRequest,
  ) {
    const searchParams = new URLSearchParams();
    searchParams.set('grant_type', 'password');
    searchParams.set('username', request.username);
    searchParams.set('password', request.password);
    searchParams.set(
      'scope',
      oauthScopeToQueryParam(this.providerParams.requiredScope),
    );
    return searchParams;
  }

  override isValidGrantRequest(
    obj: unknown,
  ): obj is ResourceOwnerPasswordGrantRequest {
    return isResourceOwnerPasswordGrantRequest(obj);
  }
}

@Injectable({ providedIn: 'root' })
export class ResourceOwnerPasswordCredentialsFlowFactory extends OauthFlowFactory<'password'> {
  override readonly grantType = 'password';
  override get(provider: OauthProviderParams) {
    return new ResourceOwnerPasswordCredentialsFlow(this, provider);
  }
}
