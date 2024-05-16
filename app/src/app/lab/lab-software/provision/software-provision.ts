import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { SoftwareInstallation, softwareInstallationFromJsonObject } from "src/app/software/installation/software-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { LabProvision, LabProvisionParams, labProvisionParamsFromJsonObject } from "../../common/provisionable/provision";


export interface SoftwareProvisionParams extends LabProvisionParams<SoftwareInstallation> {

}

export class SoftwareProvision extends LabProvision<SoftwareInstallation> implements SoftwareProvisionParams {
    constructor(params: SoftwareProvisionParams) {
        super(params);
    }

}

export function softwareProvisionFromJsonObject(json: JsonObject) {
    const baseParams = labProvisionParamsFromJsonObject(
        softwareInstallationFromJsonObject,
        json
    );

    return new SoftwareProvision({
        ...baseParams
    });
}