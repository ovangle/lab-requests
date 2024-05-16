import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { LabInstallation, LabInstallationService } from "../installable/installation";
import { Observable, firstValueFrom } from "rxjs";
import { RestfulService as RelatedModelService } from "src/app/common/model/model-service";
import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelParamsFromJsonObject, resolveRef } from "src/app/common/model/model";

export interface LabProvisionParams<TInstallation extends LabInstallation> extends ModelParams {
    status: ProvisionStatus;
    installation: TInstallation | string | null;
}

export function labProvisionParamsFromJsonObject<TInstallation extends LabInstallation>(
    labInstallationFromJsonObject: (json: JsonObject) => TInstallation,
    json: JsonObject
): LabProvisionParams<TInstallation> {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isProvisionStatus(json[ 'status' ])) {
        throw new Error("Expected a provision status 'status'");
    }

    let installation: TInstallation | string | null;
    if (json[ 'installation' ] === null) {
        installation = null;
    } else if (typeof json[ 'installation' ] === 'string') {
        installation = json[ 'installation' ];
    } else if (isJsonObject(json[ 'installation' ])) {
        installation = labInstallationFromJsonObject(json[ 'installation' ]);
    } else {
        throw new Error("Expected a string or json object (or null)")
    }

    return {
        ...baseParams,
        status: json[ 'status' ],
        installation
    };
}

export abstract class LabProvision<TInstallation extends LabInstallation> extends Model implements LabProvisionParams<TInstallation> {
    status: ProvisionStatus;
    installation: TInstallation | string | null;

    constructor(params: LabProvisionParams<TInstallation>) {
        super(params);
        this.status = params.status;
        this.installation = params.installation;
    }

    async resolveInstallation(service: LabInstallationService<any, TInstallation>): Promise<TInstallation | null> {
        if (typeof this.installation === 'string') {
            this.installation = await firstValueFrom(service.fetch(this.installation));
        }
        return this.installation as TInstallation | null;
    }
}

export interface LabProvisionQuery<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends ModelQuery<TProvision> {

}
export function labProvisionQueryToHttpParams(request: LabProvisionQuery<any, any>): HttpParams {
    const params = new HttpParams();
    return params;
}
export interface LabProvisionCreateRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends ModelCreateRequest<TProvision> {

}
export function labProvisionCreateRequestToJsonObject(request: LabProvisionCreateRequest<any, any>): JsonObject {
    return {};
}

interface LabProvisionUpdateRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends ModelUpdateRequest<TProvision> {
    readonly type: string;
}

export interface LabProvisionApprovalRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends LabProvisionUpdateRequest<TInstallation, TProvision> {
    readonly type: 'approve';
}
export function provisionApprovalRequestToJsonObject(request: LabProvisionApprovalRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionPurchaseRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends LabProvisionUpdateRequest<TInstallation, TProvision> {
    readonly type: 'purchase';
}
export function provisionPurchaseRequestToJsonObject(request: LabProvisionPurchaseRequest<any, any>): JsonObject {
    return {};
}
export interface LabProvisionInstallRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends LabProvisionUpdateRequest<TInstallation, TProvision> {
    readonly type: 'install';
}
export function provisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionCancellationRequest<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends LabProvisionUpdateRequest<TInstallation, TProvision> {
    readonly type: 'cancel';
}
export function provisionCancellationRequestToJsonObject(request: LabProvisionCancellationRequest<any, any>): JsonObject {
    return {};
}

@Injectable()
export abstract class LabProvisionService<
    TInstallation extends LabInstallation,
    TProvision extends LabProvision<TInstallation>,
    TQueryProvision extends LabProvisionQuery<TInstallation, TProvision> = LabProvisionQuery<TInstallation, TProvision>,
> extends RelatedModelService<TProvision, TQueryProvision> {
    abstract readonly provisionableQueryParam: string;
    abstract override createToJsonObject(request: LabProvisionCreateRequest<TInstallation, TProvision>): JsonObject;

    override create(request: LabProvisionCreateRequest<TInstallation, TProvision>): Observable<TProvision> {
        return super.create(request);
    }

    override updateToJsonObject(model: TProvision, request: LabProvisionUpdateRequest<TInstallation, TProvision>): JsonObject {
        switch (request.type) {
            case 'approve':
                return this.approvalRequestToJsonObject(request as LabProvisionApprovalRequest<TInstallation, TProvision>);
            case 'purchase':
                return this.purchaseRequestToJsonObject(request as LabProvisionPurchaseRequest<TInstallation, TProvision>);
            case 'install':
                return this.installRequestToJsonObject(request as LabProvisionInstallRequest<TInstallation, TProvision>);
            case 'cancel':
                return this.cancellationRequestToJsonObject(request as LabProvisionCancellationRequest<TInstallation, TProvision>);
            default:
                throw new Error(`Unrecognised provision request type ${request.type}`);
        }
    }

    protected abstract approvalRequestToJsonObject: (request: LabProvisionApprovalRequest<TInstallation, TProvision>) => JsonObject;
    protected abstract purchaseRequestToJsonObject: (request: LabProvisionPurchaseRequest<TInstallation, TProvision>) => JsonObject;
    protected abstract installRequestToJsonObject: (request: LabProvisionInstallRequest<TInstallation, TProvision>) => JsonObject;
    protected abstract cancellationRequestToJsonObject: (request: LabProvisionCancellationRequest<TInstallation, TProvision>) => JsonObject;

    markAsApproved(provision: TProvision, request: LabProvisionApprovalRequest<TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    markAsPurchased(provision: TProvision, request: LabProvisionPurchaseRequest<TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    markAsInstalled(provision: TProvision, request: LabProvisionInstallRequest<TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    cancelProvision(provision: TProvision, request: LabProvisionCancellationRequest<TInstallation, TProvision>) {
        return super.update(provision, request);
    }
}
