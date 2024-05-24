import { Observable } from "rxjs";
import { Lab } from "../../lab";
import { Installable } from "../installable/installable";
import { LabInstallation } from "../installable/installation";
import { LabProvision, LabProvisionService } from "./provision";
import { ModelParams } from "src/app/common/model/model";

export interface Provisionable<
    TInstallation extends LabInstallation<any>,
    TProvision extends LabProvision<any, TInstallation>
> extends Installable<TInstallation> {
    getCurrentProvision(lab: Lab | string, service: LabProvisionService<any, TInstallation, TProvision>): Promise<TProvision>;
}