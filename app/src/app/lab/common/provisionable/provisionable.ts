import { Observable } from "rxjs";
import { Lab } from "../../lab";
import { Installable } from "../installable/installable";
import { LabInstallation } from "../installable/installation";
import { LabProvision, LabProvisionService } from "./provision";


export interface Provisionable<TInstallation extends LabInstallation, TProvision extends LabProvision<TInstallation>> extends Installable<TInstallation> {
    getCurrentProvision(provisionService: LabProvisionService<TInstallation, TProvision>, lab: Lab): Observable<TProvision>;
}