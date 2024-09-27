import { Injectable, inject } from "@angular/core";
import { Model, ModelCreateRequest, ModelIndexPage, ModelQuery, ModelRef, ModelUpdateRequest, isEqualModelRefs, modelId, modelIndexPageFromJsonObject, setModelQueryParams } from "../common/model/model";
import { JsonObject, isJsonObject } from "../utils/is-json-object";
import { SoftwareInstallation, SoftwareInstallationQuery, SoftwareInstallationService } from "./installation/software-installation";
import { ModelService, RestfulService } from "../common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { Installable } from "../lab/common/installable/installable";
import { Provisionable } from "../lab/common/provisionable/provisionable";
import { Lab } from "../lab/lab";
import { LabProvisionService, LabProvisionQuery, LabProvision } from "../lab/common/provisionable/provision";
import { LabInstallationService } from "../lab/common/installable/installation";
import { SoftwareInstallationProvision } from "./provision/software-provision";
import { Observable, firstValueFrom, of } from "rxjs";


export class Software extends Model implements Installable<SoftwareInstallation> {
    name: string;
    description: string;
    tags: string[];

    requiresLicense: boolean;
    isPaidSoftware: boolean;

    installations: ModelIndexPage<SoftwareInstallation>;

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['name'] !== 'string') {
            throw new Error("Expected a string 'name'");
        }
        this.name = json['name'];
        if (typeof json['description'] !== 'string') {
            throw new Error("Expected a string 'description'");
        }
        this.description = json['description'];

        if (!Array.isArray(json['tags'])
            || !json['tags'].every((t) => typeof t === 'string')
        ) {
            throw new Error("Expected an array of strings 'tags'");
        }
        this.tags = [...json['tags']]

        if (!isJsonObject(json['installations'])) {
            throw new Error("Expected a json object 'installations'");
        }
        this.installations = modelIndexPageFromJsonObject(
            'installations',
            SoftwareInstallation,
            json
        );

        if (typeof json['requiresLicense'] !== 'boolean') {
            throw new Error("Expected a boolean 'requiresLicense'")
        }
        this.requiresLicense = json['requiresLicense'];

        if (typeof json['isPaidSoftware'] !== 'boolean') {
            throw new Error("Expected a boolean 'isPaidSoftware'");
        }
        this.isPaidSoftware = json['isPaidSoftware'];
    }

    getInstallation(lab: ModelRef<Lab>) {
        return this.installations.items.find(install => install.labId == modelId(lab)) || null;
    }

    queryInstallations(
        query: Partial<SoftwareInstallationQuery>,
        using: SoftwareInstallationService
    ): Observable<ModelIndexPage<SoftwareInstallation>> {
        return using.queryPage({
            ...query,
            software: this.id
        });
    }
}


export interface SoftwareQuery extends ModelQuery<Software> {
    name: string;
}
function setSoftwareQueryParams(params: HttpParams, query: Partial<SoftwareQuery>) {
    params = setModelQueryParams(params, query);

    if (query.name) {
        params = params.set('name', query.name);
    }

    return params;
}

export interface SoftwareCreateRequest extends ModelCreateRequest<Software> { }
function softwareCreateRequestToJsonObject(request: SoftwareCreateRequest): JsonObject {
    return {};
}

export interface SoftwareUpdateRequest extends ModelUpdateRequest<Software> { }
function softwareUpdateRequestToJsonObject(request: SoftwareCreateRequest): JsonObject {
    return {};
}


@Injectable({ providedIn: 'root' })
export class SoftwareService extends RestfulService<Software, SoftwareQuery> {
    override readonly path = '/software';
    override readonly model = Software;
    override readonly setModelQueryParams = setSoftwareQueryParams;

    create(request: SoftwareCreateRequest) {
        return this._doCreate(
            softwareCreateRequestToJsonObject,
            request
        );
    }
}