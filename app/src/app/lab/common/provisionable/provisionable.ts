import { Observable } from "rxjs";
import { Lab, LabService } from "../../lab";
import { Installable } from "../installable/installable";
import { LabInstallation } from "../installable/installation";
import { LabProvision, LabProvisionService } from "./provision";
import { Model, ModelCreateRequest, ModelIndexPage, ModelParams, ModelRef, resolveModelRef } from "src/app/common/model/model";
import { Injectable } from "@angular/core";
import { ModelService } from "src/app/common/model/model-service";
import { ModelContext } from "src/app/common/model/context";


export interface Provisionable<
    TProvision extends LabProvision<any>
> extends Model {
    lab: ModelRef<Lab>;

    currentProvisions: ReadonlyArray<TProvision>;

    resolveLab(service: LabService): Promise<Lab>;
    // allProvisions(service: ModelService<TProvision>): ModelIndexPage<TProvision>;
}

export interface ProvisionableCreateRequest<
    TProvisionable extends Provisionable<any>,
> extends ModelCreateRequest<TProvisionable> {
    lab: ModelRef<Lab>;
}