import { Model, ModelParams, ModelQuery, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Software, SoftwareService, softwareFromJsonObject } from "../software";
import { firstValueFrom } from "rxjs";
import { Lab, LabService, labFromJsonObject } from "src/app/lab/lab";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ModelContext, RelatedModelService } from "src/app/common/model/context";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { SoftwareContext } from "../software-context";


export interface SoftwareInstallationParams extends ModelParams {
    software: Software | string;
    lab: Lab | string;

    version: string;
}

export class SoftwareInstallation extends Model implements SoftwareInstallationParams {
    software: Software | string;
    lab: Lab | string;

    version: string;

    constructor(params: SoftwareInstallationParams) {
        super(params);
        this.software = params.software;
        this.lab = params.lab;

        this.version = params.version;
    }

    async resolveSoftware(service: SoftwareService) {
        if (typeof this.software === 'string') {
            this.software = await firstValueFrom(service.fetch(this.software));
        }
        return this.software;
    }

    async resolveLab(service: LabService) {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(service.fetch(this.lab));
        }
        return this.lab;
    }
}

export function softwareInstallationFromJsonObject(json: JsonObject) {
    const baseParams = modelParamsFromJsonObject(json);

    let software: Software | string;
    if (typeof json[ 'software' ] === 'string') {
        software = json[ 'software' ]
    } else if (isJsonObject(json[ 'software' ])) {
        software = softwareFromJsonObject(json[ 'software' ])
    } else {
        throw new Error("Expected a string or json object 'software'");
    }

    let lab: Lab | string;
    if (typeof json[ 'lab' ] === 'string') {
        lab = json[ 'lab' ]
    } else if (isJsonObject(json[ 'lab' ])) {
        lab = labFromJsonObject(json[ 'lab' ]);
    } else {
        throw new Error("Expected a string or json object 'lab'");
    }

    if (typeof json[ 'version' ] !== 'string') {
        throw new Error("Expected a string 'version'")
    }

    return new SoftwareInstallation({
        ...baseParams,
        lab,
        software,
        version: json[ 'version' ]
    });
}

export interface SoftwareInstallationQuery extends ModelQuery<SoftwareInstallation> { }
function softwareInstallationQueryToHttpParams() {
    const params = new HttpParams();
    return params;
}

@Injectable()
export class SoftwareInstallationService extends RelatedModelService<Software, SoftwareInstallation, SoftwareInstallationQuery> {
    override readonly context = inject(SoftwareContext);
    override readonly path = '/installations';
    override readonly modelFromJsonObject = softwareInstallationFromJsonObject;
    override readonly modelQueryToHttpParams = softwareInstallationQueryToHttpParams;

}