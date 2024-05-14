import { JsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus } from "./provision-status";
import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest } from "../model/model";
import { Injectable } from "@angular/core";
import { RestfulService } from "../model/model-service";
import { HttpParams } from "@angular/common/http";


export interface ProvisionableParams extends ModelParams {
    status: ProvisionStatus;
}

export class Provisionable extends Model implements ProvisionableParams {
    status: ProvisionStatus;

    constructor(params: ProvisionableParams) {
        super(params);
        this.status = params.status;
    }
}

export interface ProvisionableQuery<T extends Provisionable> extends ModelQuery<T> {

}
export function provisionableQueryToHttpParams<T extends Provisionable>(request: ProvisionableQuery<T>): HttpParams {
    const params = new HttpParams();
    return params;
}

interface Action<T> {
    readonly type: string;
}

export interface ProvisionableCreateRequest<T extends Provisionable> {

}

export interface ProvisionApprovalRequest<T extends Provisionable> extends Action<T> {
    readonly type: 'approve';
}
export function provisionApprovalRequestToJsonObject(request: ProvisionApprovalRequest<any>): JsonObject {
    return {};
}

export interface ProvisionPurchaseRequest<T extends Provisionable> extends Action<T> {
    readonly type: 'purchase';
}
export function provisionPurchaseRequestToJsonObject(request: ProvisionPurchaseRequest<any>): JsonObject {
    return {};
}
export interface ProvisionInstallRequest<T extends Provisionable> extends Action<T> {
    readonly type: 'install';
}
export function provisionInstallRequestToJsonObject(request: ProvisionInstallRequest<any>): JsonObject {
    return {};
}

export interface ProvisionCancellationRequest<T extends Provisionable> extends Action<T> {
    readonly type: 'cancel';
}
export function provisionCancellationRequestToJsonObject(request: ProvisionCancellationRequest<any>): JsonObject {
    return {};
}

@Injectable()
export abstract class ProvisionableService<T extends Provisionable, Q extends ProvisionableQuery<T>> extends RestfulService<T, Q> {
    override createToJsonObject?(request: ProvisionableCreateRequest<T>): JsonObject {
        throw new Error("Method not implemented.");
    }
    override actionToJsonObject(model: T, action: Partial<Action<T>>) {
        switch (action.type) {
            case 'approval':
                return this.approvalRequestToJsonObject(action as ProvisionApprovalRequest<T>);
            case 'purchase':
                return this.purchaseRequestToJsonObject(action as ProvisionPurchaseRequest<T>);
            case 'install':
                return this.installationRequestToJsonObject(action as ProvisionInstallRequest<T>);
            case 'cancel':
                return this.cancellationRequestToJsonObject(action as ProvisionCancellationRequest<T>);
            default:
                throw new Error('Unrecognised provision action type');
        }
    }

    abstract approvalRequestToJsonObject(request: ProvisionApprovalRequest<T>): JsonObject;
    abstract purchaseRequestToJsonObject(request: ProvisionPurchaseRequest<T>): JsonObject;
    abstract installationRequestToJsonObject(request: ProvisionInstallRequest<T>): JsonObject;
    abstract cancellationRequestToJsonObject(request: ProvisionCancellationRequest<T>): JsonObject;
}
