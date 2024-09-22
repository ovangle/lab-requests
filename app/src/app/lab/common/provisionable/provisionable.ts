import { Observable } from "rxjs";
import { Lab, LabService } from "../../lab";
import { Installable } from "../installable/installable";
import { LabInstallation } from "../installable/installation";
import { LabProvision, LabProvisionService } from "./provision";
import { Model, ModelCreateRequest, ModelIndexPage, ModelRef } from "src/app/common/model/model";
import { Injectable } from "@angular/core";
import { ModelService } from "src/app/common/model/model-service";
import { ModelContext } from "src/app/common/model/context";


export interface Provisionable<
    TProvision extends LabProvision<any>
> extends Model {
    labId: string;

    activeProvisions: ModelIndexPage<TProvision>;
}

export interface ProvisionableCreateRequest<
    TProvisionable extends Provisionable<any>,
> extends ModelCreateRequest<TProvisionable> {
    lab?: ModelRef<Lab>;
}