import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { LabInstallation, LabInstallationService } from "../installable/installation";
import { Observable, firstValueFrom } from "rxjs";
import { RestfulService as RelatedModelService } from "src/app/common/model/model-service";
import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelParamsFromJsonObject, resolveRef } from "src/app/common/model/model";
import { Installable } from "../installable/installable";
import { Provisionable } from "./provisionable";

export interface LabProvisionParams<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>
> extends ModelParams {
    status: ProvisionStatus;
    installation: TInstallation | string | null;
}

export function labProvisionParamsFromJsonObject<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>
>(
    labInstallationFromJsonObject: (json: JsonObject) => TInstallation,
    json: JsonObject
): LabProvisionParams<TProvisionable, TInstallation> {
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

export abstract class LabProvision<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>
> extends Model implements LabProvisionParams<TProvisionable, TInstallation> {
    status: ProvisionStatus;
    installation: TInstallation | string | null;

    constructor(params: LabProvisionParams<TProvisionable, TInstallation>) {
        super(params);
        this.status = params.status;
        this.installation = params.installation;
    }

    async resolveInstallation(service: LabInstallationService<TProvisionable, TInstallation>): Promise<TInstallation | null> {
        if (typeof this.installation === 'string') {
            this.installation = await firstValueFrom(service.fetch(this.installation));
        }
        return this.installation as TInstallation | null;
    }
}

export interface LabProvisionQuery<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends ModelQuery<TProvision> {

}
export function labProvisionQueryToHttpParams(request: LabProvisionQuery<any, any, any>): HttpParams {
    const params = new HttpParams();
    return params;
}
export interface LabProvisionCreateRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends ModelCreateRequest<TProvision> {

}
export function labProvisionCreateRequestToJsonObject(request: LabProvisionCreateRequest<any, any, any>): JsonObject {
    return {};
}

interface LabProvisionUpdateRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends ModelUpdateRequest<TProvision> {
    readonly type: string;
}

export interface LabProvisionApprovalRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends LabProvisionUpdateRequest<TProvisionable, TInstallation, TProvision> {
    readonly type: 'approve';
}
export function provisionApprovalRequestToJsonObject(request: LabProvisionApprovalRequest<any, any, any>): JsonObject {
    return {};
}

export interface LabProvisionPurchaseRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends LabProvisionUpdateRequest<TProvisionable, TInstallation, TProvision> {
    readonly type: 'purchase';
}
export function provisionPurchaseRequestToJsonObject(request: LabProvisionPurchaseRequest<any, any, any>): JsonObject {
    return {};
}
export interface LabProvisionInstallRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends LabProvisionUpdateRequest<TProvisionable, TInstallation, TProvision> {
    readonly type: 'install';
}
export function provisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<any, any, any>): JsonObject {
    return {};
}

export interface LabProvisionCancellationRequest<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>
> extends LabProvisionUpdateRequest<TProvisionable, TInstallation, TProvision> {
    readonly type: 'cancel';
}
export function provisionCancellationRequestToJsonObject(request: LabProvisionCancellationRequest<any, any, any>): JsonObject {
    return {};
}

@Injectable()
export abstract class LabProvisionService<
    TProvisionable extends Provisionable<any, any>,
    TInstallation extends LabInstallation<TProvisionable>,
    TProvision extends LabProvision<TProvisionable, TInstallation>,
    TQueryProvision extends LabProvisionQuery<TProvisionable, TInstallation, TProvision> = LabProvisionQuery<TProvisionable, TInstallation, TProvision>,
> extends RelatedModelService<TProvision, TQueryProvision> {
    abstract readonly provisionableQueryParam: string;
    abstract override createToJsonObject(request: LabProvisionCreateRequest<TProvisionable, TInstallation, TProvision>): JsonObject;

    override create(request: LabProvisionCreateRequest<TProvisionable, TInstallation, TProvision>): Observable<TProvision> {
        return super.create(request);
    }

    override updateToJsonObject(model: TProvision, request: LabProvisionUpdateRequest<TProvisionable, TInstallation, TProvision>): JsonObject {
        switch (request.type) {
            case 'approve':
                return this.approvalRequestToJsonObject(request as LabProvisionApprovalRequest<TProvisionable, TInstallation, TProvision>);
            case 'purchase':
                return this.purchaseRequestToJsonObject(request as LabProvisionPurchaseRequest<TProvisionable, TInstallation, TProvision>);
            case 'install':
                return this.installRequestToJsonObject(request as LabProvisionInstallRequest<TProvisionable, TInstallation, TProvision>);
            case 'cancel':
                return this.cancellationRequestToJsonObject(request as LabProvisionCancellationRequest<TProvisionable, TInstallation, TProvision>);
            default:
                throw new Error(`Unrecognised provision request type ${request.type}`);
        }
    }

    protected abstract approvalRequestToJsonObject: (request: LabProvisionApprovalRequest<TProvisionable, TInstallation, TProvision>) => JsonObject;
    protected abstract purchaseRequestToJsonObject: (request: LabProvisionPurchaseRequest<TProvisionable, TInstallation, TProvision>) => JsonObject;
    protected abstract installRequestToJsonObject: (request: LabProvisionInstallRequest<TProvisionable, TInstallation, TProvision>) => JsonObject;
    protected abstract cancellationRequestToJsonObject: (request: LabProvisionCancellationRequest<TProvisionable, TInstallation, TProvision>) => JsonObject;

    markAsApproved(provision: TProvision, request: LabProvisionApprovalRequest<TProvisionable, TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    markAsPurchased(provision: TProvision, request: LabProvisionPurchaseRequest<TProvisionable, TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    markAsInstalled(provision: TProvision, request: LabProvisionInstallRequest<TProvisionable, TInstallation, TProvision>) {
        return super.update(provision, request);
    }

    cancelProvision(provision: TProvision, request: LabProvisionCancellationRequest<TProvisionable, TInstallation, TProvision>) {
        return super.update(provision, request);
    }
}
