import { Component, Injectable, inject } from "@angular/core";
import { SoftwareInstallation, SoftwareInstallationQuery, SoftwareInstallationService } from "./software-installation";
import { ModelIndex } from "src/app/common/model/model-index";
import { ParamMap } from "@angular/router";


@Injectable()
export class SoftwareInstallationIndex extends ModelIndex<SoftwareInstallation, SoftwareInstallationQuery> {

    override readonly service = inject(SoftwareInstallationService);
    override _queryFromRouteParams(paramMap: ParamMap): Partial<SoftwareInstallationQuery> {
        throw new Error("Method not implemented.");
    }
}

