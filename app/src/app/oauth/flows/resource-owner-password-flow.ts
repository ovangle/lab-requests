import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { OauthProvider, OauthProviderContext } from "../oauth-provider";
import { catchError, of, throwError, timeout } from "rxjs";
import { AbstractOauthFlow, OauthFlowStateStore } from "./abstract-oauth-flow";
import { Resource } from "src/app/lab/work-unit/resource/resource";
import { isJsonObject } from "src/app/utils/is-json-object";

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
    
    override readonly grantType = 'password';
    override readonly store = new OauthFlowStateStore();

    override async _getInitialFlowState(provider: OauthProvider) {
        if (provider !== 'ovangle.com') {
            throw new Error('Only native users can log in directly as resource owner');
        }
        return {};
    }

    override redirectToLogin() {
        return null;
    }

    override requestToUrlSearchParams(request: ResourceOwnerPasswordGrantRequest) {
        const searchParams = new URLSearchParams();
        searchParams.set('grant_type', 'password'); 
        searchParams.set('username', request.username);
        searchParams.set('password', request.password);
        searchParams.set('scope', this.requiredScope);
        return searchParams;
    }

    override isValidParams(obj: unknown): obj is ResourceOwnerPasswordGrantRequest {
        return isResourceOwnerPasswordGrantRequest(obj);
    }
}