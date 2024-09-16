import { Observable } from "rxjs";
import { Lab, LabService } from "../../lab";
import { LabInstallation, LabInstallationService } from "./installation";
import { Model, ModelIndexPage, ModelQuery, ModelRef, modelId } from "src/app/common/model/model";
import { Injectable, inject } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { LabProvision, LabProvisionService } from "../provisionable/provision";


export interface Installable<TInstallation extends LabInstallation<any, any>> extends Model {
    installations: ModelIndexPage<TInstallation>;
    getInstallation(lab: Lab | string, using: ModelService<TInstallation>): Promise<TInstallation | null>;
}

@Injectable()
export abstract class LabInstallableService<TInstallable extends Installable<any>> extends ModelService<TInstallable> {

}