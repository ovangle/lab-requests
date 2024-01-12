import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";


export interface SoftwareProvisionParams extends ModelParams {

}

export class SoftwareProvision extends Model {
    constructor(params: SoftwareProvisionParams) {
        super(params);
    }

}

export function softwareProvisionFromJsonObject(json: JsonObject) {
    const baseParams = modelParamsFromJsonObject(json);

    return new SoftwareProvision({
        ...baseParams
    });
}