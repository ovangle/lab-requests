import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { LabInstallation, LabInstallationService } from "../installable/installation";
import { Observable, firstValueFrom } from "rxjs";
import { ModelService, RestfulService as RelatedModelService } from "src/app/common/model/model-service";
import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelRef, ModelUpdateRequest, modelParamsFromJsonObject, resolveRef } from "src/app/common/model/model";
import { Installable } from "../installable/installable";
import { Provisionable } from "./provisionable";

export interface LabProvisionParams<
    TProvisionable extends Provisionable<any>
> extends ModelParams {
    type: string;
    status: ProvisionStatus;
    target: ModelRef<TProvisionable>;
}

export function labProvisionParamsFromJsonObject<
    TProvisionable extends Provisionable<any>,
>(
    typeFromString: (type: string) => string,
    targetFromJsonObject: (json: JsonObject) => TProvisionable,
    json: JsonObject
): LabProvisionParams<TProvisionable> {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isProvisionStatus(json['status'])) {
        throw new Error("Expected a provision status 'status'");
    }

    if (typeof json['type'] !== 'string') {
        throw new Error("Expected a string 'type'");
    }

    let target: TProvisionable | string;
    if (typeof json['target'] === 'string') {
        target = json['target'];
    } else if (isJsonObject(json['target'])) {
        target = targetFromJsonObject(json['target']);
    } else {
        throw new Error("Expected a string or json object (or null)")
    }

    return {
        ...baseParams,
        type: typeFromString(json['type']),
        status: json['status'],
        target
    };
}

export abstract class LabProvision<
    TProvisionable extends Provisionable<any>,
> extends Model implements LabProvisionParams<TProvisionable> {
    type: string;
    status: ProvisionStatus;
    target: TProvisionable | string;

    constructor(params: LabProvisionParams<TProvisionable>) {
        super(params);
        this.type = params.type;
        this.status = params.status;
        this.target = params.target;
    }

    async resoleTarget(service: ModelService<TProvisionable>): Promise<TProvisionable> {
        if (typeof this.target === 'string') {
            this.target = await firstValueFrom(service.fetch(this.target));
        }
        return this.target;
    }
}

export interface LabProvisionQuery<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelQuery<TProvision> {

}
export function labProvisionQueryToHttpParams(request: LabProvisionQuery<any, any>): HttpParams {
    const params = new HttpParams();
    return params;
}
export interface LabProvisionCreateRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelCreateRequest<TProvision> {
    readonly type: string;
}

export function labProvisionCreateRequestToJsonObject(request: LabProvisionCreateRequest<any, any>): JsonObject {
    return {};
}

interface LabProvisionUpdateRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelUpdateRequest<TProvision> {
    readonly type: string;
}

export interface LabProvisionApprovalRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
    readonly type: 'approve';
}
export function provisionApprovalRequestToJsonObject(request: LabProvisionApprovalRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionPurchaseRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
    readonly type: 'purchase';
}
export function provisionPurchaseRequestToJsonObject(request: LabProvisionPurchaseRequest<any, any>): JsonObject {
    return {};
}
export interface LabProvisionInstallRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
    readonly type: 'install';
}
export function provisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionCancellationRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
    readonly type: 'cancel';
}
export function provisionCancellationRequestToJsonObject(request: LabProvisionCancellationRequest<any, any>): JsonObject {
    return {};
}

@Injectable()
export abstract class LabProvisionService<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>,
    TQueryProvision extends LabProvisionQuery<TProvisionable, TProvision> = LabProvisionQuery<TProvisionable, TProvision>,
> extends RelatedModelService<TProvision, TQueryProvision> {
    abstract readonly provisionableQueryParam: string;
    abstract override createToJsonObject(request: LabProvisionCreateRequest<TProvisionable, TProvision>): JsonObject;

    override create(request: LabProvisionCreateRequest<TProvisionable, TProvision>): Observable<TProvision> {
        return super.create(request);
    }

    override updateToJsonObject(model: TProvision, request: LabProvisionUpdateRequest<TProvisionable, TProvision>): JsonObject {
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
