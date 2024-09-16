import { Model, ModelCreateRequest, ModelIndexPage, ModelQuery, ModelRef, ModelUpdateRequest, modelId, modelRefFromJson, resolveRef } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, EquipmentCreateRequest, equipmentCreateRequestToJsonObject, EquipmentService, isEquipmentCreateRequest } from "../equipment";
import { ResearchFunding, ResearchFundingService } from "src/app/research/funding/research-funding";
import { Lab, LabService } from "../../lab/lab";
import { Observable, first, firstValueFrom, map, switchMap } from "rxjs";
import { EquipmentInstallation, EquipmentInstallationCreateRequest, EquipmentInstallationQuery, EquipmentInstallationService, equipmentInstallationCreateRequestToJsonObject, setEquipmentInstallationQueryParams } from "../installation/equipment-installation";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { RelatedModelService } from "src/app/common/model/context";
import { ProvisionStatus, isProvisionStatus } from "src/app/lab/common/provisionable/provision-status";
import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { LabProvision, LabProvisionApprovalRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionApprovalRequestToJsonObject, labProvisionCreateRequestToJsonObject, labProvisionInstallRequestToJsonObject, labProvisionPurchaseRequestToJsonObject, setLabProvisionQueryParams } from "src/app/lab/common/provisionable/provision";

export type EquipmentProvisionType
    = 'new_equipment'
    | 'declare_equipment';

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
