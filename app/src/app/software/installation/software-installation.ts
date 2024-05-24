import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Software, SoftwareService, softwareFromJsonObject } from "../software";
import { firstValueFrom } from "rxjs";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { LabInstallation, LabInstallationParams, LabInstallationService, labInstallationParamsFromJsonObject } from "src/app/lab/common/installable/installation";


export interface SoftwareInstallationParams extends LabInstallationParams<Software> {
    software: Software | string;

    version: string;
}

export class SoftwareInstallation extends LabInstallation<Software> implements SoftwareInstallationParams {
    software: Software | string;
    version: string;

    constructor(params: SoftwareInstallationParams) {
        super(params);

        this.software = params.software;
        this.version = params.version;
    }

    async resolveSoftware(service: SoftwareService) {
        if (typeof this.software === 'string') {
            this.software = await firstValueFrom(service.fetch(this.software));
        }
        return this.software;
    }
}


export function softwareInstallationFromJsonObject(json: JsonObject): SoftwareInstallation {
    const baseParams = labInstallationParamsFromJsonObject(
        softwareFromJsonObject,
        'software',
        json
    );

    const software: Software | string = baseParams.installable;

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
export class SoftwareInstallationService extends LabInstallationService<Software, SoftwareInstallation> {
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