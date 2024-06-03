import { Observable } from "rxjs";
import { Lab, LabService } from "../../lab";
import { LabInstallation, LabInstallationService } from "./installation";
import { Model, ModelParams, ModelQuery, ModelRef, modelId } from "src/app/common/model/model";
import { Injectable, inject } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";


export interface Installable<TInstallation extends LabInstallation<any, any>> extends Model {
    getCurrentInstallation(lab: Lab | string, service: LabInstallationService<any, TInstallation>): Promise<TInstallation | null>;
}