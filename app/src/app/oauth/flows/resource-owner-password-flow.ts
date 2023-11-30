import { isJsonObject } from "src/app/utils/is-json-object";
import { OauthGrantType } from "../oauth-grant-type";
import { OauthProviderParams } from "../oauth-provider";
import { oauthScopeToQueryParam } from "../utils";
import { AbstractOauthFlow, OauthFlowEnv, OauthFlowFactory } from "./abstract-oauth-flow";
import { Injectable } from "@angular/core";

export interface ResourceOwnerPasswordGrantRequest {
    username: string;
    password: string;
}

function isResourceOwnerPasswordGrantRequest(obj: unknown): obj is ResourceOwnerPasswordGrantRequest {
    return isJsonObject(obj)
        && typeof obj['username'] === 'string'
        && typeof obj['password'] === 'string'
}


export class ResourceOwnerPasswordCredentialsFlow extends AbstractOauthFlow<ResourceOwnerPasswordGrantRequest> {
    override readonly grantType: OauthGrantType = 'password';

    override generateInitialFlowState() {
        return Promise.resolve({provider: this.provider, grantType: this.grantType});
    }

    override redirectToLogin() {
        return null;
    }

    override requestToUrlSearchParams(
        request: ResourceOwnerPasswordGrantRequest
    ) {
        const searchParams = new URLSearchParams();
        searchParams.set('grant_type', 'password'); 
        searchParams.set('username', request.username);
        searchParams.set('password', request.password);
        searchParams.set('scope', oauthScopeToQueryParam(this.providerParams.requiredScope));
        return searchParams;
    }

    override isValidTokenParams(obj: unknown): obj is ResourceOwnerPasswordGrantRequest {
        return isResourceOwnerPasswordGrantRequest(obj);
    }
}

@Injectable({providedIn: 'root'})
export class ResourceOwnerPasswordCredentialsFlowFactory extends OauthFlowFactory {
    override readonly grantType = 'password';
    override get(env: OauthFlowEnv, provider: OauthProviderParams) {
        return new ResourceOwnerPasswordCredentialsFlow(env, provider);
    }
}

