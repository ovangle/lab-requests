import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelRef, ModelUpdateRequest, modelParamsFromJsonObject, modelRefJsonDecoder, resolveModelRef } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, EquipmentCreateRequest, equipmentCreateRequestToJsonObject, equipmentFromJsonObject, EquipmentService, isEquipmentCreateRequest } from "../equipment";
import { ResearchFunding, ResearchFundingService, researchFundingFromJsonObject } from "src/app/research/funding/research-funding";
import { Lab, LabService, labFromJsonObject } from "../../lab/lab";
import { Observable, first, firstValueFrom, map, switchMap } from "rxjs";
import { EquipmentInstallation, EquipmentInstallationCreateRequest, EquipmentInstallationQuery, EquipmentInstallationService, equipmentInstallationCreateRequestToJsonObject, equipmentInstallationFromJsonObject, setEquipmentInstallationQueryParams } from "../installation/equipment-installation";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { RelatedModelService } from "src/app/common/model/context";
import { ProvisionStatus, isProvisionStatus } from "src/app/lab/common/provisionable/provision-status";
import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { LabProvision, LabProvisionApprovalRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionParams, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionApprovalRequestToJsonObject, labProvisionCreateRequestToJsonObject, labProvisionInstallRequestToJsonObject, labProvisionParamsFromJsonObject, labProvisionPurchaseRequestToJsonObject, setLabProvisionQueryParams } from "src/app/lab/common/provisionable/provision";

export type EquipmentProvisionType
    = 'new_equipment'
    | 'declare_equipment';

export interface EquipmentProvisionParams extends LabProvisionParams<EquipmentInstallation> {
    readonly type: EquipmentProvisionType;
    equipment: ModelRef<Equipment>;
}

export class EquipmentProvision extends LabProvision<EquipmentInstallation> implements EquipmentProvisionParams {
    override readonly type: EquipmentProvisionType;
    equipmentInstallation: ModelRef<EquipmentInstallation>;
    equipment: ModelRef<Equipment>;

    constructor(params: EquipmentProvisionParams) {
        super(params);

        this.type = params.type as any;
        this.equipmentInstallation = params.target;
        this.equipment = params.equipment;

        this.status = params.status;
        this.numRequired = params.numRequired;
        this.estimatedCost = params.estimatedCost;
    }

    get isActive() {
        return ![ 'installed', 'cancelled' ].includes(this.status);
    }

    resolveEquipmentInstallation(using: EquipmentInstallationService) {
        return this.resolveTarget(using);
    }

    async resolveEquipment(using: EquipmentService) {
        return resolveModelRef(this, 'equipment', using as any);
    }
}


export function equipmentProvisionFromJsonObject(json: JsonObject): EquipmentProvision {
    const baseParams = labProvisionParamsFromJsonObject(
        (value: string) => {
            if (![ 'new_software' ].includes(value)) {
                throw new Error('Expected an equipment provision type')
            }
            return value as EquipmentProvisionType;
        },
        equipmentInstallationFromJsonObject,
        json
    );

    const equipment = modelRefJsonDecoder('equipment', equipmentFromJsonObject)(json);

    return new EquipmentProvision({
        ...baseParams,
        equipment
    });
}

export interface EquipmentProvisionQuery extends LabProvisionQuery<EquipmentInstallation, EquipmentProvision, EquipmentInstallationQuery> {
}
function setEquipmentProvisionQueryParams(params: HttpParams, query: EquipmentProvisionQuery) {
    params = setLabProvisionQueryParams(params, query, setEquipmentInstallationQueryParams);
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
    target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest;
    numRequired: number;
}

export function newEquipmentRequestToJsonObject(request: NewEquipmentRequest): JsonObject {
    return {
        ...labProvisionCreateRequestToJsonObject(
            equipmentInstallationCreateRequestToJsonObject,
            request
        )
    };
}

/**
 * Declare equipment that already exists in the lab,
 * skipping approval, purchase and installation.
 */
export interface DeclareEquipmentRequest extends _EquipmentProvisionCreateRequest {
    readonly type: 'declare_equipment';
    readonly target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest;
    numInstalled: number;
}

export function declareEquipmentRequestToJsonObject(request: DeclareEquipmentRequest): JsonObject {
    return {
        ...labProvisionCreateRequestToJsonObject(
            equipmentInstallationCreateRequestToJsonObject,
            request
        )
    };
}
export type EquipmentProvisionCreateRequest
    = NewEquipmentRequest
    | DeclareEquipmentRequest;

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

@Injectable()
export class EquipmentProvisionService extends LabProvisionService<EquipmentInstallation, EquipmentProvision> {

    override readonly provisionableQueryParam: string = 'equipment';
    override readonly path: string = '/equipment-provisions';
    override readonly modelFromJsonObject = equipmentProvisionFromJsonObject;
    override readonly setModelQueryParams = setEquipmentProvisionQueryParams;

    protected override readonly _provisionApprovalRequestToJsonObject = equipmentProvisionApprovalRequestToJsonObject;
    protected override readonly _provisionPurchaseRequestToJsonObject = equipmentProvisionPurchasedRequestToJsonObject;
    protected override readonly _provisionInstallRequestToJsonObject = equipmentProvisionInstallRequestToJsonObject;

    newEquipment(request: NewEquipmentRequest) {
        return this._doCreate(
            newEquipmentRequestToJsonObject,
            request
        );
    }
    declareEquipment(request: DeclareEquipmentRequest) {
        return this._doCreate(
            declareEquipmentRequestToJsonObject,
            request
        );
    }

    override create<TRequest extends LabProvisionCreateRequest<EquipmentInstallation, EquipmentProvision>>(request: TRequest): Observable<EquipmentProvision> {
        switch (request.type) {
            case 'new_equipment':
                return this.newEquipment(request as NewEquipmentRequest);
            default:
                throw new Error(`Unrecognised equipment provision type ${request.type}`);
        }
    }

}
