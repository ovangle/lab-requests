import { Injectable } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { SoftwareInstallation, SoftwareInstallationService } from "./software-installation";

@Injectable()
export class SoftwareInstallationContext extends ModelContext<SoftwareInstallation, SoftwareInstallationService> {

}

export function provideSoftwareInstallationContextFromRouteParam(isOptionalParam: boolean = false) {
    return provideModelContextFromRoute(
        SoftwareInstallationService,
        SoftwareInstallationContext,
        'software_installation',
        isOptionalParam
    )
}