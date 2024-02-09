import { Injectable } from "@angular/core";
import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, LabEquipmentCreateRequest, labEquipmentCreateRequestToJson, equipmentFromJsonObject } from "../equipment";
import { RestfulService } from "src/app/common/model/model-service";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { Lab } from "../../lab";
import { map } from "rxjs";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "../installation/equipment-installation";

export interface LabEquipmentProvisionParams extends ModelParams {
    equipmentId: string;
    equipmentName: string;
    install: EquipmentInstallation | null;
    reason: string;
}

export class LabEquipmentProvision extends Model implements LabEquipmentProvisionParams {
    equipmentId: string;
    equipmentName: string;
    install: EquipmentInstallation | null;
    reason: string;

    constructor(params: LabEquipmentProvisionParams) {
        super(params);
        this.equipmentId = params.equipmentId;
        this.equipmentName = params.equipmentName;
        this.install = params.install;
        this.reason = params.reason;
    }
}

export function labEquipmentProvisionFromJsonObject(json: JsonObject): LabEquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    if (typeof json[ 'equipmentId' ] !== 'string') {
        throw new Error("Expected a string 'equipmentId'")
    }

    if (typeof json[ 'equipmentName' ] !== 'string') {
        throw new Error("Expected a string 'equipmentName'");
    }
    if (!isJsonObject(json[ 'install' ]) && json[ 'install' ] !== null) {
        throw new Error("Expected a json object or null 'install'");
    }
    const install = json[ 'install' ] && equipmentInstallationFromJsonObject(json[ 'install' ])

    if (typeof json[ 'reason' ] !== 'string') {
        throw new Error("Expected a string 'reason'");
    }

    return new LabEquipmentProvision({
        ...baseParams,
        equipmentId: json[ 'equipmentId' ],
        equipmentName: json[ 'equipmentName' ],
        install,
        reason: json[ 'reason' ]
    });
}

export interface LabEquipmentProvisionRequest {
    equipment: Equipment | LabEquipmentCreateRequest | string;
    reason: string;
    lab: Lab | string | null;
    funding: ResearchFunding | string | null;
    estimatedCost: number | null;
    quantityRequired: number;
    purchaseUrl: string;
}



function equipmentProvisionRequestToJson(request: LabEquipmentProvisionRequest) {
    let equipment: JsonObject | string;
    if (request.equipment instanceof Equipment) {
        equipment = request.equipment.id;
    } else if (typeof request.equipment === 'string') {
        equipment = request.equipment;
    } else {
        equipment = labEquipmentCreateRequestToJson(request.equipment);
    }

    let funding: string | null;
    if (request.funding instanceof ResearchFunding) {
        funding = request.funding.id;
    } else {
        funding = request.funding;
    }

    return {
        equipment,
        funding,
        reason: request.reason,
        lab: request.lab,
        estimatedCost: request.estimatedCost,
        quantitytRequired: request.quantityRequired,
        purchaseUrl: request.purchaseUrl
    };
}
export interface LabEquipmentProvisionApprovalRequest {
    readonly provisionId: string;
    actualCost: number;
    purchaseUrl: string;
}

function labEquipmentProvisionApprovalRequestToJsonObject(request: LabEquipmentProvisionApprovalRequest) {
    return request;
}

export interface LabEquipmentProvisionInstallRequest {
    readonly provisionId: string;
}

function labEquipmentProvisionInstallRequestToJsonObject(request: LabEquipmentProvisionInstallRequest) {
    return request;
}

@Injectable({ providedIn: 'root' })
export class LabEquipmentProvisioningService extends RestfulService<LabEquipmentProvision> {
    override model = LabEquipmentProvision;
    override modelFromJsonObject = labEquipmentProvisionFromJsonObject;
    override path = '/labs/equipment/provision';

    request(request: LabEquipmentProvisionRequest) {
        return this._httpClient.post<JsonObject>(
            this.indexUrl,
            equipmentProvisionRequestToJson(request)
        ).pipe(
            map(labEquipmentProvisionFromJsonObject)
        );
    }

    approve(request: LabEquipmentProvisionApprovalRequest) {
        return this._httpClient.post<JsonObject>(
            this.indexUrl,
            labEquipmentProvisionApprovalRequestToJsonObject(request)
        ).pipe(
            map(labEquipmentProvisionFromJsonObject)
        )
    }

    install(request: LabEquipmentProvisionInstallRequest) {
        return this._httpClient.post<JsonObject>(
            this.indexUrl,
            labEquipmentProvisionInstallRequestToJsonObject(request)
        ).pipe(
            map(labEquipmentProvisionFromJsonObject)
        );
    }
}