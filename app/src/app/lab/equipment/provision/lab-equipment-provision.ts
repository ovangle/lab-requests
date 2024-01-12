import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";

export interface LabEquipmentProvisionParams extends ModelParams {

}

export class LabEquipmentProvision extends Model {
    constructor(params: LabEquipmentProvisionParams) {
        super(params);
    }
}

export function labEquipmentProvisionFromJsonObject(json: JsonObject): LabEquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    return {
        ...baseParams
    };
}