import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ModelIndexPage, ModelRef, modelId, modelRefFromJson, resolveRef } from "src/app/common/model/model";
import { LabProvision, LabProvisionApprovalRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionApprovalRequestToJsonObject, labProvisionCreateRequestToJsonObject, labProvisionInstallRequestToJsonObject, labProvisionPurchaseRequestToJsonObject, setLabProvisionQueryParams } from "src/app/lab/common/provisionable/provision";
import { CreatePurchaseOrder } from "src/app/research/budget/research-budget";
import { JsonObject } from "src/app/utils/is-json-object";
import { Lab } from "../../lab/lab";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentInstallation, EquipmentInstallationQuery, EquipmentInstallationService } from "../installation/equipment-installation";

export type EquipmentProvisionType
    = 'new_equipment'
    | 'equipment_transfer';

export class EquipmentProvision extends LabProvision<EquipmentInstallation> {
    equipmentInstallation: ModelRef<EquipmentInstallation>;
    equipment: ModelRef<Equipment>;

    constructor(json: JsonObject) {
        super(EquipmentInstallation, json);

        this.equipment = modelRefFromJson('equipment', Equipment, json);
        this.equipmentInstallation = modelRefFromJson('equipmentInstallation', EquipmentInstallation, json);
    }

    get isActive() {
        return !['installed', 'cancelled'].includes(this.status);
    }

    resolveEquipmentInstallation(using: EquipmentInstallationService) {
        return this.resolveTarget(using);
    }

    async resolveEquipment(using: EquipmentService) {
        return resolveRef(this.equipment, using);
    }
}

export interface EquipmentProvisionQuery extends LabProvisionQuery<EquipmentInstallation, EquipmentProvision, EquipmentInstallationQuery> {
    installation: EquipmentInstallation | string;
}

function setEquipmentProvisionQueryParams(params: HttpParams, query: EquipmentProvisionQuery) {
    params = setLabProvisionQueryParams(params, query);

    if (query.installation) {
        params = params.set('installation', modelId(query.installation))
    }

    return params;
}

interface _EquipmentProvisionCreateRequest extends LabProvisionCreateRequest<EquipmentInstallation, EquipmentProvision> {
    readonly type: EquipmentProvisionType;
}

/**
 * Add new equipment to the lab.
 */
export interface NewEquipmentRequest extends _EquipmentProvisionCreateRequest {
    readonly type: 'new_equipment';
    equipment: Equipment | string;
    numRequired: number;
}

export function newEquipmentRequestToJsonObject(request: NewEquipmentRequest): JsonObject {
    return {
        ...labProvisionCreateRequestToJsonObject(
            request
        ),
        equipment: modelId(request.equipment),
        numRequired: request.numRequired,
    };
}

/**
 * Creates a provision to transfer equipment currently installed in the source
 * lab to the destination lab.
 */
export interface EquipmentTransferRequest extends _EquipmentProvisionCreateRequest {
    readonly type: 'equipment_transfer';
    equipment: Equipment | string;
    /**
     * The source of the transfer
    */
    lab: Lab | string;
    destinationLab: Lab | string;
    numTransferred: number;
    /*
     * Covers the cost of transportation, if any
     */
    purchaseOrder?: CreatePurchaseOrder;
}

export function transferEquipmentRequestToJsonObject(request: EquipmentTransferRequest) {
    return {
        ...labProvisionCreateRequestToJsonObject(
            request,
        ),
        equipment: modelId(request.equipment),
        targetLab: modelId(request.destinationLab),
        numTransferred: request.numTransferred,
    }
}

export type EquipmentProvisionCreateRequest
    = NewEquipmentRequest
    | EquipmentTransferRequest

export interface EquipmentProvisionApprovalRequest extends LabProvisionApprovalRequest<EquipmentInstallation, EquipmentProvision> {
}

export function equipmentProvisionApprovalRequestToJsonObject(request: EquipmentProvisionApprovalRequest) {
    return labProvisionApprovalRequestToJsonObject(
        request
    );
}

export interface EquipmentProvisionPurchasedRequest extends LabProvisionPurchaseRequest<EquipmentInstallation, EquipmentProvision> {
}

export function equipmentProvisionPurchasedRequestToJsonObject(request: EquipmentProvisionPurchasedRequest) {
    return labProvisionPurchaseRequestToJsonObject(
        request
    );
}

export interface EquipmentProvisionInstallRequest extends LabProvisionInstallRequest<EquipmentInstallation, EquipmentProvision> {
}

export function equipmentProvisionInstallRequestToJsonObject(request: EquipmentProvisionInstallRequest) {
    return labProvisionInstallRequestToJsonObject(request)
}

@Injectable({ providedIn: 'root' })
export class EquipmentProvisionService extends LabProvisionService<EquipmentInstallation, EquipmentProvision, EquipmentProvisionQuery> {

    override readonly provisionableQueryParam: string = 'equipment';
    override readonly path: string = '/equipment-provisions';
    override readonly model = EquipmentProvision;
    override readonly setModelQueryParams = setEquipmentProvisionQueryParams;

    protected override readonly _provisionApprovalRequestToJsonObject = equipmentProvisionApprovalRequestToJsonObject;
    protected override readonly _provisionPurchaseRequestToJsonObject = equipmentProvisionPurchasedRequestToJsonObject;
    protected override readonly _provisionInstallRequestToJsonObject = equipmentProvisionInstallRequestToJsonObject;

    getActiveProvisionsPage(installation: EquipmentInstallation | string): Observable<ModelIndexPage<EquipmentProvision>> {
        return this.queryPage({
            installation: installation
        });
    }

    newEquipment(request: NewEquipmentRequest) {
        return this._doCreate(
            newEquipmentRequestToJsonObject,
            request
        );
    }

    transferEquipment(request: EquipmentTransferRequest) {
        return this._doCreate(
            transferEquipmentRequestToJsonObject,
            request
        );
    }
}
