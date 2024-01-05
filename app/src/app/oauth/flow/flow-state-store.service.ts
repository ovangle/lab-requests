import { Injectable, inject } from '@angular/core';
import { LocalStorage } from '../../utils/local-storage';
import { OauthGrantType } from '../oauth-grant-type';
import { OauthProviderContext, OauthProvider } from '../oauth-provider';

export interface OauthFlowState<GrantType extends OauthGrantType> {
  readonly grantType: GrantType;
  readonly provider: OauthProvider;
  readonly restoreRoute?: string;
}
export type OauthFlowStateParams<T extends OauthFlowState<any>> = Omit<
  T,
  'grantType' | 'provider'
>;

export function oauthFlowState<
  GrantType extends OauthGrantType,
  State extends OauthFlowState<GrantType>,
>(
  provider: OauthProvider,
  grantType: OauthGrantType,
  initialState: OauthFlowStateParams<State>,
): State {
  return { ...initialState, grantType, provider } as State;
}

const OAUTH_FLOW_STATE_KEY = 'oauthFlowState';

/**
 * Global service which perisists state associated with the currently executing
 * oauth flow into browser local storage.
 *
 * If the oauth provider context changes, any current flow in progress is cleared
 */
@Injectable({ providedIn: 'root' })
export class OauthFlowStateStore {
  readonly storage = inject(LocalStorage);

  constructor(providerContext: OauthProviderContext) {
    if (this.isFlowInProgress('any', 'any')) {
      const flowState = this.load();
      providerContext.setCurrent(flowState.provider);
    }

    providerContext.registerOnChange(() => {
      if (this.isFlowInProgress('any', 'any')) {
        const { provider, grantType } = this.load();
        console.warn(
          `Clearing data for paritally completed ${grantType} flow ${provider}`,
        );
        this.clearCurrentFlowState();
      }
    });
  }

  isFlowInProgress(
    provider: OauthProvider | 'any',
    grantType: OauthGrantType | 'any',
  ): boolean {
    const state = this._load();
    if (!state) {
      return false;
    }
    if (provider !== 'any' && state.provider !== provider) {
      return false;
    }
    if (grantType !== 'any' && state.grantType !== grantType) {
      return false;
    }
    return true;
  }

  checkIsAnyFlowInProgress(): void {
    if (!this.isFlowInProgress('any', 'any')) {
      throw new Error(`No flow in progress`);
    }
  }

  checkIsNoFlowInProgress(): void {
    if (this.isFlowInProgress('any', 'any')) {
      const state = this.load();
      throw new Error(
        `Cannot initialize oauth flow. A ${state.provider} ${state.grantType} flow is already in progress`,
      );
    }
  }
  checkIsFlowInProgress(
    provider: OauthProvider,
    grantType: OauthGrantType,
  ): void {
    if (!this.isFlowInProgress(provider, grantType)) {
      throw new Error(`No ${provider} ${grantType} flow in progress`);
    }
  }

  initialize<
    GrantType extends OauthGrantType,
    State extends OauthFlowState<GrantType>,
  >(state: State): void {
    this.checkIsNoFlowInProgress();
    this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state));
  }

  clearCurrentFlowState(): void {
    this.checkIsAnyFlowInProgress();
    this.storage.removeItem(OAUTH_FLOW_STATE_KEY);
  }

  private _load() {
    return JSON.parse(this.storage.getItem(OAUTH_FLOW_STATE_KEY)!);
  }

  load<
    GrantType extends OauthGrantType,
    State extends OauthFlowState<GrantType>,
  >(): State {
    this.checkIsAnyFlowInProgress();
    return this._load();
  }

  update<
    GrantType extends OauthGrantType,
    State extends OauthFlowState<GrantType>,
  >(state: State) {
    this.checkIsFlowInProgress(state.provider, state.grantType);
    this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state));
  }
}
