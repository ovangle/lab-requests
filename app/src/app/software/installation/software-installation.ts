import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Software, SoftwareService, softwareFromJsonObject } from "../software";
import { firstValueFrom } from "rxjs";
import { Lab, LabService, labFromJsonObject } from "src/app/lab/lab";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ModelContext, RelatedModelService } from "src/app/common/model/context";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { SoftwareContext } from "../software-context";
import { LabInstallation, LabInstallationParams, LabInstallationService, labInstallationParamsFromJsonObject } from "src/app/lab/common/installable/installation";
import { Installable } from "src/app/lab/common/installable/installable";


export interface SoftwareInstallationParams extends LabInstallationParams {
    software: Software | string;

    version: string;
}

export class SoftwareInstallation extends LabInstallation implements SoftwareInstallationParams {
    software: Software | string;

    version: string;

    get installable() {
        return this.software as Installable<this>;
    }

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
}


export function softwareInstallationFromJsonObject(json: JsonObject) {
    const baseParams = labInstallationParamsFromJsonObject(json);

    let software: Software | string;
    if (typeof json[ 'software' ] === 'string') {
        software = json[ 'software' ]
    } else if (isJsonObject(json[ 'software' ])) {
        software = softwareFromJsonObject(json[ 'software' ])
    } else {
        throw new Error("Expected a string or json object 'software'");
    }

    if (typeof json[ 'version' ] !== 'string') {
        throw new Error("Expected a string 'version'")
    }

    return new SoftwareInstallation({
        ...baseParams,
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
export class SoftwareInstallationService extends LabInstallationService<SoftwareInstallation> {
    override readonly path = '/installations';
    override readonly modelFromJsonObject = softwareInstallationFromJsonObject;
    override readonly modelQueryToHttpParams = softwareInstallationQueryToHttpParams;

    override createToJsonObject?(request: ModelCreateRequest<SoftwareInstallation>): JsonObject {
        throw new Error("Method not implemented.");
    }
    override updateToJsonObject?(model: SoftwareInstallation, request: Partial<ModelUpdateRequest<SoftwareInstallation>>): JsonObject {
        throw new Error("Method not implemented.");
    }
}