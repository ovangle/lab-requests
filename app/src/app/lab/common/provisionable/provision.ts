import { JsonObject, isJsonObject, nullableFromJson } from "src/app/utils/is-json-object";
import { ProvisionStatus, ProvisionStatusMetadata, isProvisionStatus, provisionStatusMetadataFromJsonObject } from "./provision-status";
import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";
import { ModelService, RestfulService as RelatedModelService } from "src/app/common/model/model-service";
import { Model, ModelCreateRequest, ModelFactory, ModelQuery, ModelRef, ModelUpdateRequest, isModelRef, modelId, modelRefFromJson, resolveRef, setModelQueryParams } from "src/app/common/model/model";
import { Provisionable, ProvisionableCreateRequest } from "./provisionable";
import { Lab } from "../../lab";
import { UnitOfMeasurement, isUnitOfMeasurement } from "src/app/common/measurement/measurement";
import { ResearchFunding, ResearchFundingService } from "src/app/research/funding/research-funding";
import { CreatePurchaseOrder, createPurchaseOrderToJsonObject, ResearchBudget, ResearchPurchase, ResearchPurchaseOrder } from "src/app/research/budget/research-budget";
import { isUUID } from "src/app/utils/is-uuid";
import { parseISO } from "date-fns";
import { LabWork } from "../lab-work";

export interface ProvisionEvent {
    status: ProvisionStatus;
    at: Date;
    byId: string;
    note: string;
}

function provisionEventFromJsonObject(json: JsonObject): ProvisionEvent {
    if (!isProvisionStatus(json['status'])) {
        throw new Error(`Expected a provision status 'status'`);
    }

    if (typeof json['at'] !== 'string') {
        throw new Error(`Expected a datetime string 'at'`);
    }
    if (!isUUID(json['byId'])) {
        throw new Error(`Expected a uuid 'byId'`);
    }

    if (typeof json['note'] !== 'string') {
        throw new Error(`Expected a string 'note'`);
    }

    return {
        status: json['status'],
        at: parseISO(json['at']),
        byId: json['byId'],
        note: json['note']
    };
}



export abstract class LabProvision<
    TProvisionable extends Provisionable<any>,
> extends Model implements ResearchPurchaseOrder {
    readonly type: string;
    readonly action: string;
    readonly status: ProvisionStatus;
    readonly targetId: string;
    readonly labId: string;

    readonly budget: ResearchBudget;
    readonly purchase: ResearchPurchase | null;
    get orderedById() {
        return this.requestedById;
    }
    readonly estimatedCost: number;

    readonly work: LabWork;

    readonly requestedById: string;
    readonly requestedAt: Date;

    readonly allRequests: ReadonlyArray<ProvisionEvent>;

    readonly isRejected: boolean;
    readonly rejectedAt: Date | null;
    readonly rejectedById: string | null;

    readonly allRejections: ReadonlyArray<ProvisionEvent>;

    readonly isDenied: boolean;
    readonly deniedAt: Date | null;
    readonly deniedById: string | null;

    readonly isApproved: boolean;
    readonly approvedAt: Date | null;
    readonly approvedById: string | null;

    readonly isPurchased: boolean;
    readonly purchasedAt: Date | null;
    readonly purchasedById: string | null;

    readonly isCompleted: boolean;
    readonly completedAt: Date | null;
    readonly completedById: string | null;

    readonly isCancelled: boolean;
    readonly cancelledAt: Date | null;
    readonly cancelledById: string | null;


    readonly isFinalised: boolean;
    readonly finalisedAt: Date | null;
    readonly finalisedById: string | null;

    constructor(targetModel: ModelFactory<TProvisionable>, json: JsonObject) {
        super(json);

        if (typeof json['type'] !== 'string') {
            throw new Error("Expected a provision type 'type'")
        }
        this.type = json['type'];

        if (!isProvisionStatus(json['status'])) {
            throw new Error("Expected a provision status 'status'");
        }

        this.status = json['status'];
        if (typeof json['type'] !== 'string') {
            throw new Error("Expected a string 'type'");
        }
        this.type = json['type'];
        if (typeof json['action'] !== 'string') {
            throw new Error("Expected a string 'action'");
        }
        this.action = json['action'];

        if (!isUUID(json['targetId'])) {
            throw new Error("Expected a uuid 'targetId'");
        }
        this.targetId = json['targetId'];
        if (!isUUID(json['labId'])) {
            throw new Error("Epxected a uuid 'labId'")
        }
        this.labId = json['labId']

        if (!isJsonObject(json['budget'])) {
            throw new Error("Expected a json object 'budget'");
        }
        this.budget = new ResearchBudget(json['budget']);

        if (typeof json['estimatedCost'] !== 'number') {
            throw new Error("Expected a number 'estimatedCost'");
        }
        this.estimatedCost = json['estimatedCost'];

        if (json['purchase'] == null) {
            this.purchase = null;
        } else if (isJsonObject(json['purchase'])) {
            this.purchase = new ResearchPurchase(json['purchase']);
        } else {
            throw new Error("Expected a json object 'purhcase'");
        }

        if (!isJsonObject(json['work'])) {
            throw new Error("Expected a json object 'work'");
        }
        this.work = new LabWork(json['work']);

        if (!isUUID(json['requestedById'])) {
            throw new Error("Expected a uuid 'requestedById");
        }
        this.requestedById = json['requestedById'];

        if (typeof json['requestedAt'] !== 'string') {
            throw new Error("Expected a datetime string 'requestedAt'");
        }
        this.requestedAt = parseISO(json['requestedAt']);

        if (!Array.isArray(json['allRequests']) || !json['allRequests'].every(isJsonObject)) {
            throw new Error("Expected a list of json objects 'allRequests'");
        }
        this.allRequests = json['allRequests'].map(provisionEventFromJsonObject);

        if (typeof json['isRejected'] !== 'boolean') {
            throw new Error("Expected a boolean 'isRejected'");
        }
        this.isRejected = json['isRejected'];

        if (json['rejectedAt'] === null) {
            this.rejectedAt = null;
        } else if (typeof json['rejectedAt'] === 'string') {
            this.rejectedAt = parseISO(json['rejectedAt']);
        } else {
            throw new Error("Expected a datetime string 'rejectedAt'");
        }

        if (json['rejectedById'] !== null || !isUUID(json['rejectedById'])) {
            throw new Error("Expected a uuid 'rejectedById");
        } else {
            this.rejectedById = json['rejectedById'];
        }

        if (!Array.isArray(json['allRejections']) || !json['allRejections'].every(isJsonObject)) {
            throw new Error("Expected a list of json objects 'allRejections'");
        }
        this.allRejections = json['allRejections'].map(provisionEventFromJsonObject);

        if (typeof json['isDenied'] !== 'boolean') {
            throw new Error("Expected a boolean 'isDenied'");
        }
        this.isDenied = json['isDenied'];

        if (json['deniedAt'] === null) {
            this.deniedAt = null;
        } else if (typeof json['deniedAt'] === 'string') {
            this.deniedAt = parseISO(json['deniedAt']);
        } else {
            throw new Error("Expected a datetime string 'deniedAt'");
        }

        if (json['deniedById'] !== null || !isUUID(json['deniedById'])) {
            throw new Error("Expected a uuid 'deniedById");
        } else {
            this.deniedById = json['deniedById'];
        }

        if (typeof json['isApproved'] !== 'boolean') {
            throw new Error("Expected a boolean 'isApproved'");
        }
        this.isApproved = json['isApproved'];

        if (json['approvedAt'] === null) {
            this.approvedAt = null;
        } else if (typeof json['approvedAt'] === 'string') {
            this.approvedAt = parseISO(json['approvedAt']);
        } else {
            throw new Error("Expected a datetime string 'approvedAt'");
        }

        if (json['approvedById'] !== null || !isUUID(json['approvedById'])) {
            throw new Error("Expected a uuid 'approvedById");
        } else {
            this.approvedById = json['approvedById'];
        }

        if (typeof json['isPurchased'] !== 'boolean') {
            throw new Error("Expected a boolean 'isPurchased'");
        }
        this.isPurchased = json['isPurchased'];

        if (json['purchasedAt'] === null) {
            this.purchasedAt = null;
        } else if (typeof json['purchasedAt'] === 'string') {
            this.purchasedAt = parseISO(json['purchasedAt']);
        } else {
            throw new Error("Expected a datetime string 'purchasedAt'");
        }

        if (json['purchasedById'] !== null || !isUUID(json['purchasedById'])) {
            throw new Error("Expected a uuid 'purchasedById");
        } else {
            this.purchasedById = json['purchasedById'];
        }

        if (typeof json['isCompleted'] !== 'boolean') {
            throw new Error("Expected a boolean 'isCompleted'");
        }
        this.isCompleted = json['isCompleted'];

        if (json['completedAt'] === null) {
            this.completedAt = null;
        } else if (typeof json['completedAt'] === 'string') {
            this.completedAt = parseISO(json['completedAt']);
        } else {
            throw new Error("Expected a datetime string 'completedAt'");
        }

        if (json['completedById'] !== null || !isUUID(json['completedById'])) {
            throw new Error("Expected a uuid 'completedById");
        } else {
            this.completedById = json['completedById'];
        }

        if (typeof json['isCancelled'] !== 'boolean') {
            throw new Error("Expected a boolean 'isCancelled'");
        }
        this.isCancelled = json['isCancelled'];

        if (json['cancelledAt'] === null) {
            this.cancelledAt = null;
        } else if (typeof json['cancelledAt'] === 'string') {
            this.cancelledAt = parseISO(json['cancelledAt']);
        } else {
            throw new Error("Expected a datetime string 'cancelledAt'");
        }

        if (json['cancelledById'] !== null || !isUUID(json['cancelledById'])) {
            throw new Error("Expected a uuid 'cancelledById");
        } else {
            this.cancelledById = json['cancelledById'];
        }

        if (typeof json['isFinalised'] !== 'boolean') {
            throw new Error("Expected a boolean 'isFinalised'");
        }
        this.isFinalised = json['isFinalised'];

        if (json['finalisedAt'] === null) {
            this.finalisedAt = null;
        } else if (typeof json['finalisedAt'] === 'string') {
            this.finalisedAt = parseISO(json['finalisedAt']);
        } else {
            throw new Error("Expected a datetime string 'finalisedAt'");
        }

        if (json['finalisedById'] !== null || !isUUID(json['finalisedById'])) {
            throw new Error("Expected a uuid 'finalisedById");
        } else {
            this.finalisedById = json['finalisedById'];
        }
    }

    async resolveTarget(service: ModelService<TProvisionable>): Promise<TProvisionable> {
        return firstValueFrom(service.fetch(this.targetId));
    }

    resolveLab(service: ModelService<Lab>): Promise<Lab> {
        return firstValueFrom(service.fetch(this.labId));
    }
}

export interface LabProvisionQuery<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>,
    TProvisionableQuery extends ModelQuery<TProvisionable> = ModelQuery<TProvisionable>
> extends ModelQuery<TProvision> {
    lab?: Lab | string;
}
export function setLabProvisionQueryParams<TProvisionableQuery extends ModelQuery<any> = ModelQuery<any>>(
    params: HttpParams,
    query: Partial<LabProvisionQuery<any, any, TProvisionableQuery>>,
): HttpParams {
    params = setModelQueryParams(params, query);

    if (query.lab) {
        params = params.set('lab', modelId(query.lab))
    }

    return params;
}

export interface LabProvisionCreateRequest<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> extends ModelCreateRequest<TProvision> {
    readonly type: string;
    readonly note: string;
    readonly lab: ModelRef<Lab>;
    readonly purchaseOrder?: CreatePurchaseOrder;
}

export function labProvisionCreateRequestToJsonObject<
    TProvisionable extends Provisionable<any>,
    TCreate extends LabProvisionCreateRequest<TProvisionable, any>
>(
    request: TCreate
): JsonObject {
    return {
        type: request.type,
        note: request.note,
        lab: modelId(request.lab),
        purchaseOrder: request.purchaseOrder ? createPurchaseOrderToJsonObject(request.purchaseOrder) : undefined
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

    protected _provisionApprovalRequestToJsonObject(approval: LabProvisionApprovalRequest<TProvisionable, TProvision>): JsonObject {
        return labProvisionPurchaseRequestToJsonObject(approval);
    }

    markAsApproved(provision: TProvision, request: LabProvisionApprovalRequest<TProvisionable, TProvision>): Observable<TProvision> {
        return this._doUpdate(
            provision,
            (approval) => this._provisionApprovalRequestToJsonObject(approval),
            request
        );
    }

    protected _provisionPurchaseRequestToJsonObject(purchase: LabProvisionPurchaseRequest<TProvisionable, TProvision>) {
        return labProvisionPurchaseRequestToJsonObject(purchase);
    }

    markAsPurchased(provision: TProvision, request: LabProvisionPurchaseRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            provision,
            (request) => this._provisionPurchaseRequestToJsonObject(request),
            request
        );
    }

    protected _provisionInstallRequestToJsonObject(request: LabProvisionInstallRequest<TProvisionable, TProvision>) {
        return labProvisionInstallRequestToJsonObject(request)
    }

    markAsInstalled(provision: TProvision, request: LabProvisionInstallRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            provision,
            (request) => this._provisionInstallRequestToJsonObject(request),
            request
        );
    }

    protected _cancellationRequestToJsonObject(request: LabProvisionCancellationRequest<TProvisionable, TProvision>) {
        return labProvisionCancellationRequestToJsonObject(request);
    }

    cancelProvision(provision: TProvision, request: LabProvisionCancellationRequest<TProvisionable, TProvision>) {
        return this._doUpdate(
            provision,
            (request) => this._cancellationRequestToJsonObject(request),
            request
        );
    }
}
