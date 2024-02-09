import { validate as validateIsUUID } from 'uuid';

import { ModelParams, Model, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, isProvisionStatus } from "../provision/provision-status";

export interface EquipmentInstallationParams extends ModelParams {
    equipmentId: string;
    labId: string;
    numInstalled: number;
    provisionStatus: ProvisionStatus;
}

export class EquipmentInstallation extends Model implements EquipmentInstallationParams {
    equipmentId: string;
    labId: string;
    numInstalled: number;
    provisionStatus: string;

    constructor(params: EquipmentInstallationParams) {
        super(params);
        this.equipmentId = params.equipmentId;
        this.labId = params.labId;
        this.numInstalled = params.numInstalled;
        this.provisionStatus = params.provisionStatus;
    }
}

export function equipmentInstallationFromJsonObject(obj: JsonObject): EquipmentInstallation {
    const baseParams = modelParamsFromJsonObject(obj);
    if (typeof obj[ 'equipmentId' ] !== 'string' || !validateIsUUID(obj[ 'equipmentId' ])) {
        throw new Error("Expected a uuid 'equipmentId")
    }
    if (typeof obj[ 'labId' ] !== 'string' || !validateIsUUID(obj[ 'labId' ])) {
        throw new Error("Expected a uuid 'labId'")
    }
    if (typeof obj[ 'numInstalled' ] !== 'number') {
        throw new Error('Expected a number numInstalled');
    }
    if (!isProvisionStatus(obj[ 'provisionStatus' ])) {
        throw new Error("Expected a provision status 'provisionStatus");
    }

    return new EquipmentInstallation({
        ...baseParams,
        equipmentId: obj[ 'equipmentId' ],
        labId: obj[ 'labId' ],
        numInstalled: obj[ 'numInstalled' ],
        provisionStatus: obj[ 'provisionStatus' ]
    });
}
