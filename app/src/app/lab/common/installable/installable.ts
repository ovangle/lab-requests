import { Observable } from "rxjs";
import { Lab, LabService } from "../../lab";
import { LabInstallation, LabInstallationService } from "./installation";
import { Model, ModelIndexPage, ModelParams, ModelQuery, ModelRef, modelId } from "src/app/common/model/model";
import { Injectable, inject } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { LabProvision, LabProvisionService } from "../provisionable/provision";


export interface Installable<TInstallation extends LabInstallation<any, any>> extends Model {
    currentInstallations: ReadonlyArray<TInstallation>;

    getCurrentInstallation(lab: Lab | string): TInstallation | undefined;
}