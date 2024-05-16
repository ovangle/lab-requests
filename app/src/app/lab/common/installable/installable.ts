import { Observable } from "rxjs";
import { Lab } from "../../lab";
import { LabInstallation } from "./installation";
import { ModelParams } from "src/app/common/model/model";


export interface Installable<TInstallation extends LabInstallation> extends ModelParams {
    getCurrentInstallation(lab: Lab): Observable<TInstallation | null>;
}