import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelRef, ModelUpdateRequest, modelId, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Software, SoftwareService, softwareFromJsonObject } from "../software";
import { firstValueFrom } from "rxjs";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { LabInstallation, LabInstallationParams, LabInstallationQuery, LabInstallationService, labInstallationParamsFromJsonObject, setLabInstallationQueryParams } from "src/app/lab/common/installable/installation";
import { Provisionable, ProvisionableCreateRequest } from "src/app/lab/common/provisionable/provisionable";
import { SoftwareProvision, SoftwareProvisionInstallRequest, softwareProvisionFromJsonObject } from "../provision/software-provision";
import { SoftwareContext } from "../software-context";
import { Lab } from "src/app/lab/lab";


export interface SoftwareInstallationParams extends LabInstallationParams<Software, SoftwareProvision> {
    software: Software | string;
    version: string;

    currentProvisions: readonly SoftwareProvision[];
}

export class SoftwareInstallation extends LabInstallation<Software, SoftwareProvision> implements SoftwareInstallationParams {
    software: Software | string;
    version: string;
    override currentProvisions: readonly SoftwareProvision[];

    constructor(params: SoftwareInstallationParams) {
        super(params);

        this.software = params.software;
        this.version = params.version;
        this.currentProvisions = [ ...params.currentProvisions ];
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
        softwareProvisionFromJsonObject,
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

export interface SoftwareInstallationQuery extends LabInstallationQuery<Software, SoftwareInstallation> {
    software?: ModelRef<Software>;
}
export function setSoftwareInstallationQueryParams(params: HttpParams, query: Partial<SoftwareInstallationQuery>) {
    params = setLabInstallationQueryParams(params, query, 'software');

    if (query.software) {
        params = params.set('software', modelId(query.software));
    }

    return params;
}


export interface SoftwareInstallationCreateRequest extends ProvisionableCreateRequest<SoftwareInstallation> {
    software: ModelRef<Software>;
}

export function softwareInstallationCreateRequestToJsonObject(request: SoftwareInstallationCreateRequest) {
    return {
        lab: modelId(request.lab),
        software: modelId(request.software)
    };
}

@Injectable({ providedIn: 'root' })
export class SoftwareInstallationService extends LabInstallationService<Software, SoftwareInstallation, SoftwareInstallationQuery> {
    override readonly path = '/installations';
    override readonly modelFromJsonObject = softwareInstallationFromJsonObject;
    override readonly setModelQueryParams = setSoftwareInstallationQueryParams;

    override readonly context = inject(SoftwareContext);
}