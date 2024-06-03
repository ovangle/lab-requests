import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, ProvisionStatusMetadata, isProvisionStatus, provisionStatusMetadataFromJsonObject } from "./provision-status";
import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";
import { ModelService, RestfulService as RelatedModelService } from "src/app/common/model/model-service";
import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelRef, ModelUpdateRequest, isModelRef, modelId, modelParamsFromJsonObject, modelRefJsonDecoder, resolveRef, setModelQueryParams } from "src/app/common/model/model";
import { Provisionable, ProvisionableCreateRequest } from "./provisionable";
import { Lab, labFromJsonObject } from "../../lab";
import { CostEstimate, costEstimateFromJsonObject, costEstimateToJsonObject } from "src/app/research/funding/cost-estimate/cost-estimate";
import { UnitOfMeasurement, isUnitOfMeasurement } from "src/app/common/measurement/measurement";

export interface LabProvisionParams<
    TProvisionable extends Provisionable<any>
> extends ModelParams {
    type: string;
    status: ProvisionStatus;
    target: ModelRef<TProvisionable>;
    lab: ModelRef<Lab>;

    unit: UnitOfMeasurement;
    numRequired: number;

    estimatedCost: CostEstimate | null;
    purchaseCost: CostEstimate | null;

    requestedStatusMetadata: ProvisionStatusMetadata<'requested'>;
    approvalStatusMetadata?: ProvisionStatusMetadata<'approved'>;
    purchaseStatusMetadata?: ProvisionStatusMetadata<'purchased'>;
    installedStatusMetadata?: ProvisionStatusMetadata<'installed'>;
    cancelledStatusMetadata?: ProvisionStatusMetadata<'cancelled'>;
}

export function labProvisionParamsFromJsonObject<
    TProvisionable extends Provisionable<any>,
    TType extends string
>(
    typeFromString: (type: string) => TType,
    targetFromJsonObject: (json: JsonObject) => TProvisionable,
    json: JsonObject
): LabProvisionParams<TProvisionable> & { readonly type: TType; } {
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

    let estimatedCost: CostEstimate | null;
    if (isJsonObject(json['estimatedCost'])) {
        estimatedCost = costEstimateFromJsonObject(json['estimatedCost']);
    } else if (json['estimatedCost'] == null) {
        estimatedCost = null;
    } else {
        throw new Error("Expected a json object or null, 'estimatedCost'");
    }

    let purchaseCost: CostEstimate | null;
    if (isJsonObject(json['actualCost'])) {
        purchaseCost = costEstimateFromJsonObject(json['actualCost']);
    } else if (json['actualCost'] == null) {
        purchaseCost = null;
    } else {
        throw new Error("Expected a json object or null, 'actualCost'");
    }

    let lab = modelRefJsonDecoder(
        'lab',
        labFromJsonObject
    )(json);

    if (!isUnitOfMeasurement(json['unit'])) {
        throw new Error("Expected a unit of measurement, 'unit'");
    }
    if (typeof json['numRequired'] !== 'number') {
        throw new Error("Expected a number 'numRequired'");
    }
    return {
        ...baseParams,
        type: typeFromString(json['type']),
        status: json['status'],
        lab,
        target,
        estimatedCost,
        purchaseCost,
        unit: json['unit'],
        numRequired: json['numRequired'],
        requestedStatusMetadata: provisionStatusMetadataFromJsonObject('requested', json)!,
        approvalStatusMetadata: provisionStatusMetadataFromJsonObject('approved', json),
        purchaseStatusMetadata: provisionStatusMetadataFromJsonObject('purchased', json),
        installedStatusMetadata: provisionStatusMetadataFromJsonObject('installed', json),
        cancelledStatusMetadata: provisionStatusMetadataFromJsonObject('cancelled', json)
    }
}

export abstract class LabProvision<
    TProvisionable extends Provisionable<any>,
> extends Model implements LabProvisionParams<TProvisionable> {
    type: string;
    status: ProvisionStatus;
    target: TProvisionable | string;
    lab: ModelRef<Lab>;

    unit: UnitOfMeasurement;
    numRequired: number;

    get quantityRequired(): [number, UnitOfMeasurement] {
        return [this.numRequired, this.unit];
    }

    estimatedCost: CostEstimate | null;
    purchaseCost: CostEstimate | null;

    requestedStatusMetadata: ProvisionStatusMetadata<'requested'>;

    approvalStatusMetadata?: ProvisionStatusMetadata<'approved'>;
    get isApproved() { return this.approvalStatusMetadata !== undefined; }

    purchaseStatusMetadata?: ProvisionStatusMetadata<'purchased'>;
    get isPurchased() { return this.purchaseStatusMetadata !== undefined; }

    installedStatusMetadata?: ProvisionStatusMetadata<'installed'>;
    get isInstalled() { return this.installedStatusMetadata !== undefined; }

    cancelledStatusMetadata?: ProvisionStatusMetadata<'cancelled'>;
    get isCancelled() { return this.cancelledStatusMetadata !== undefined; }

    constructor(params: LabProvisionParams<TProvisionable>) {
        super(params);
        this.type = params.type;
        this.status = params.status;
        this.target = params.target;
        this.lab = params.lab;
        this.estimatedCost = params.estimatedCost;
        this.purchaseCost = params.purchaseCost;

        this.unit = params.unit;
        this.numRequired = params.numRequired;

        this.requestedStatusMetadata = params.requestedStatusMetadata;
        this.approvalStatusMetadata = params.approvalStatusMetadata;
        this.purchaseStatusMetadata = params.purchaseStatusMetadata;
        this.installedStatusMetadata = params.installedStatusMetadata;
        this.cancelledStatusMetadata = params.cancelledStatusMetadata;
    }

    provisionStatusMetadata(status: ProvisionStatus) {
        switch (status) {
            case 'requested':
                return this.requestedStatusMetadata;
            case 'approved':
                return this.approvalStatusMetadata;
            case 'purchased':
                return this.purchaseStatusMetadata;
            case 'installed':
                return this.installedStatusMetadata;
            case 'cancelled':
                return this.cancelledStatusMetadata;
            default:
                throw new Error(`Unrecognised provision status ${status}`);
        }
    }

    get statusMetadataHistory(): ReadonlyArray<ProvisionStatusMetadata<any>> {
        const metadatas: ProvisionStatusMetadata<any>[] = [
            this.requestedStatusMetadata
        ];
        if (this.status === 'requested') {
            return metadatas;
        }

        metadatas.push(this.approvalStatusMetadata!);
        if (this.status === 'approved') {
            return metadatas;
        }

        metadatas.push(this.purchaseStatusMetadata!);
        if (this.status === 'purchased') {
            return metadatas;
        }

        metadatas.push(this.installedStatusMetadata!);
        if (this.status === 'installed') {
            return metadatas;
        }

        if (this.status === 'cancelled') {
            metadatas.push(this.cancelledStatusMetadata!);
            return metadatas;
        }

        throw new Error('Unrecognised provision status');
    }


    get currentStatusMetadata(): ProvisionStatusMetadata<(typeof this)['status']> {
        return this.provisionStatusMetadata(this.status)!;
    }

    async resolveTarget(service: ModelService<TProvisionable>): Promise<TProvisionable> {
        if (typeof this.target === 'string') {
            this.target = await firstValueFrom(service.fetch(this.target));
        }
        return this.target;
    }

    async resolveLab(service: ModelService<Lab>) {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(service.fetch(this.lab));
        }
        return this.lab;
    }
}

export interface LabProvisionQuery<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelQuery<TProvision> {

}
export function setLabProvisionQueryParams(params: HttpParams, query: Partial<LabProvisionQuery<any, any>>): HttpParams {
    params = setModelQueryParams(params, query);
    return params;
}

export interface LabProvisionCreateRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelCreateRequest<TProvision> {
    readonly type: string;
    readonly target: ModelRef<TProvisionable> | ProvisionableCreateRequest<TProvisionable>;

    readonly unit: UnitOfMeasurement;
    readonly numRequired: number;

    readonly estimatedCost: CostEstimate | null;
}

type CreateTarget<
    TProvisionable extends Provisionable<any>,
    TCreate extends LabProvisionCreateRequest<TProvisionable, any>
> = Exclude<TCreate['target'], ModelRef<TProvisionable>>;

export function labProvisionCreateRequestToJsonObject<
    TProvisionable extends Provisionable<any>,
    TCreate extends LabProvisionCreateRequest<TProvisionable, any>
>(
    createTargetRequestToJson: (create: CreateTarget<TProvisionable, TCreate>) => JsonObject,
    request: TCreate
): JsonObject {
    let target: JsonObject | string;
    if (isModelRef(request.target)) {
        target = modelId(request.target);
    } else {
        target = createTargetRequestToJson(request.target);
    }

    return {
        type: request.type,
        target,
        unit: request.unit,
        numRequired: request.numRequired,
        estimatedCost: request.estimatedCost ? costEstimateToJsonObject(request.estimatedCost) : null
    };
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
export function labProvisionApprovalRequestToJsonObject(request: LabProvisionApprovalRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionPurchaseRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
}
export function labProvisionPurchaseRequestToJsonObject(request: LabProvisionPurchaseRequest<any, any>): JsonObject {
    return {};
}
export interface LabProvisionInstallRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
}
export function labProvisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<any, any>): JsonObject {
    return {};
}

export interface LabProvisionCancellationRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends LabProvisionUpdateRequest<TProvisionable, TProvision> {
}
export function labProvisionCancellationRequestToJsonObject(request: LabProvisionCancellationRequest<any, any>): JsonObject {
    return {};
}

@Injectable()
export abstract class LabProvisionService<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>,
    TQueryProvision extends LabProvisionQuery<TProvisionable, TProvision> = LabProvisionQuery<TProvisionable, TProvision>,
> extends RelatedModelService<TProvision, TQueryProvision> {
    abstract readonly provisionableQueryParam: string;

    abstract create<TRequest extends LabProvisionCreateRequest<TProvisionable, TProvision>>(
        request: TRequest
    ): Observable<TProvision>;

    protected _provisionApprovalRequestToJsonObject(approval: LabProvisionApprovalRequest<TProvisionable, TProvision>): JsonObject {
        return labProvisionPurchaseRequestToJsonObject(approval);
    }

    markAsApproved(provision: TProvision, request: LabProvisionApprovalRequest<TProvisionable, TProvision>): Observable<TProvision> {
        return this._doUpdate(
            (_, approval) => this._provisionApprovalRequestToJsonObject(approval),
            provision,
            request
        );
    }

    protected _provisionPurchaseRequestToJsonObject(purchase: LabProvisionPurchaseRequest<TProvisionable, TProvision>) {
        return labProvisionPurchaseRequestToJsonObject(purchase);
    }

    markAsPurchased(provision: TProvision, request: LabProvisionPurchaseRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            (_, request) => this._provisionPurchaseRequestToJsonObject(request),
            provision,
            request
        );
    }

    protected _provisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<TProvisionable, TProvision>) {
        return labProvisionInstallRequestToJsonObject(request)
    }

    markAsInstalled(provision: TProvision, request: LabProvisionInstallRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            (_, request) => this._provisionInstallRequestToJsonObject(request),
            provision,
            request
        );
    }

    protected _cancellationRequestToJsonObject(request: LabProvisionCancellationRequest<TProvisionable, TProvision>) {
        return labProvisionCancellationRequestToJsonObject(request);
    }

    cancelProvision(provision: TProvision, request: LabProvisionCancellationRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            (_, request) => this._cancellationRequestToJsonObject(request),
            provision,
            request
        );
    }
}
