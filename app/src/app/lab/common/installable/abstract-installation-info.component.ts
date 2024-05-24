import { Directive, input } from "@angular/core";
import { LabInstallation } from "./installation";
import { Installable } from "./installable";


@Directive()
export class AbstractInstallationInfoDirective<TInstallable extends Installable<any>, TInstallation extends LabInstallation<TInstallable> {
    installation = input<TInstallation>();

}