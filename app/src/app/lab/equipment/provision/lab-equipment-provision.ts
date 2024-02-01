import { Injectable } from "@angular/core";
import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, LabEquipmentCreateRequest, labEquipmentCreateRequestToJson } from "../equipment";
import { RestfulService } from "src/app/common/model/model-service";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { Lab } from "../../lab";
import { map } from "rxjs";

export interface LabEquipmentProvisionParams extends ModelParams {
    equipment: Equipment;

}

export class LabEquipmentProvision extends Model implements LabEquipmentProvisionParams {
    equipment: Equipment;
    constructor(params: LabEquipmentProvisionParams) {
        super(params);
        this.equipment = params.equipment;
    }
}

export function labEquipmentProvisionFromJsonObject(json: JsonObject): LabEquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isJsonObject(json[ 'equipment' ])) {
        throw new Error("Expected a json object 'equipment'")
    }

    return new LabEquipmentProvision({
        ...baseParams,
        equipment
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
export class EquipmentProvisioningService extends RestfulService<LabEquipmentProvision> {
    override model = LabEquipmentProvision;
    override modelFromJsonObject = labEquipmentProvisionFromJsonObject;
    override path = '/lab/equipments/provisioning';

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