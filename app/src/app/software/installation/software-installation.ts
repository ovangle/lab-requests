import { Model, ModelCreateRequest, ModelQuery, ModelRef, ModelUpdateRequest, modelId, modelRefFromJson } from "src/app/common/model/model";
import { Software, SoftwareService } from "../software";
import { filter, firstValueFrom, map, Observable } from "rxjs";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { LabInstallation, LabInstallationQuery, LabInstallationService, setLabInstallationQueryParams } from "src/app/lab/common/installable/installation";
import { Provisionable, ProvisionableCreateRequest } from "src/app/lab/common/provisionable/provisionable";
import { SoftwareInstallationProvision, SoftwareProvisionInstallRequest } from "../provision/software-provision";
import { SoftwareContext } from "../software-context";
import { Lab } from "src/app/lab/lab";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { SoftwareLease } from "../lease/software-lease";
import { isUUID } from "src/app/utils/is-uuid";


export class SoftwareInstallation extends LabInstallation<Software, SoftwareInstallationProvision> {
    softwareId: string;
    get installableId() { return this.softwareId }

    softwareName: string;

    installedVersion: string;

    constructor(json: JsonObject) {
        super(SoftwareInstallationProvision, SoftwareLease, json);

        if (!isUUID(json['softwareId'])) {
            throw new Error("Expected a uuid 'softwareId'");
        }
        this.softwareId = json['softwareId'];

        if (typeof json['softwareName'] !== 'string') {
            throw new Error("Expected a string 'softwareName'");
        }
        this.softwareName = json['softwareName'];

        if (typeof json['installedVersion'] !== 'string') {
            throw new Error("Expected a string 'installedVersion'")
        }
        this.installedVersion = json['installedVersion'];
    }

    async resolveSoftware(service: SoftwareService) {
        return await firstValueFrom(service.fetch(this.softwareId));
    }

    async resolveInstallable(service: ModelService<Software>) {
        if (!(service instanceof SoftwareService)) {
            throw new Error('Service must be a SoftwareService');
        }
        return await this.resolveSoftware(service);
    }
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
export class SoftwareInstallationService extends RestfulService<SoftwareInstallation, SoftwareInstallationQuery> {
    override readonly path = '/installations';
    override readonly model = SoftwareInstallation;
    override readonly setModelQueryParams = setSoftwareInstallationQueryParams;

    getForLabSoftware(software: ModelRef<Software>, lab: ModelRef<Lab>): Observable<SoftwareInstallation> {
        return this.queryOne({ software, lab }).pipe(
            map((result) => {
                if (result == null) {
                    throw new Error('A (possibly empty) install exists for every lab');
                }
                return result;
            })

        );

    }
}