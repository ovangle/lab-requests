import { Directive, computed } from "@angular/core";
import { LabInstallation } from "./installation";
import { Installable } from "./installable";


@Directive()
export class AbstractInstallationInfoDirective<TInstallable extends Installable<any>, TInstallation extends LabInstallation<TInstallable>> {
    installation = input.required<TInstallation>();

    installable = computed(() => this.installation.installable);
    lab = computed(() => this.installation.lab);
}