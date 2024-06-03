import { Injectable, inject } from "@angular/core";
import { Model, ModelCreateRequest, ModelIndexPage, ModelParams, ModelQuery, ModelUpdateRequest, modelIndexPageFromJsonObject, modelParamsFromJsonObject, setModelQueryParams } from "../common/model/model";
import { JsonObject, isJsonObject } from "../utils/is-json-object";
import { SoftwareInstallation, SoftwareInstallationQuery, SoftwareInstallationService, softwareInstallationFromJsonObject } from "./installation/software-installation";
import { ModelService, RestfulService } from "../common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { Installable } from "../lab/common/installable/installable";
import { Provisionable } from "../lab/common/provisionable/provisionable";
import { Lab } from "../lab/lab";
import { LabProvisionService, LabProvisionQuery } from "../lab/common/provisionable/provision";
import { LabInstallationService } from "../lab/common/installable/installation";
import { SoftwareProvision } from "./provision/software-provision";
import { Observable, firstValueFrom } from "rxjs";


export interface SoftwareParams extends ModelParams {
    name: string;
    description: string;
    tags: readonly string[];

    requiresLicense: boolean;
    isPaidSoftware: boolean;

    installationsPage: ModelIndexPage<SoftwareInstallation>;
}

export class Software extends Model implements SoftwareParams, Installable<SoftwareInstallation> {
    name: string;
    description: string;
    tags: string[];

    requiresLicense: boolean;
    isPaidSoftware: boolean;

    installationsPage: ModelIndexPage<SoftwareInstallation>;

    constructor(params: SoftwareParams) {
        super(params);
        this.name = params.name;
        this.description = params.description;
        this.tags = [...params.tags];

        this.requiresLicense = params.requiresLicense;
        this.isPaidSoftware = params.isPaidSoftware;

        this.installationsPage = params.installationsPage;
    }

    getCurrentInstallation(
        lab: Lab,
        installationService: LabInstallationService<Software, SoftwareInstallation>
    ): Promise<SoftwareInstallation | null> {
        throw new Error("Method not implemented.");
    }

    queryInstallations(
        query: Partial<SoftwareInstallationQuery>,
        usingService: ModelService<SoftwareInstallation, SoftwareInstallationQuery>
    ): Observable<ModelIndexPage<SoftwareInstallation>> {
        return usingService.queryPage({
            ...query,
            software: this.id
        });
    }
}

export function softwareFromJsonObject(json: JsonObject): Software {
    const baseParams = modelParamsFromJsonObject(json);

    if (typeof json['name'] !== 'string') {
        throw new Error("Expected a string 'name'");
    }
    if (typeof json['description'] !== 'string') {
        throw new Error("Expected a string 'description'");
    }

    if (!Array.isArray(json['tags'])
        || !json['tags'].every((t) => typeof t === 'string')
    ) {
        throw new Error("Expected an array of strings 'tags'");
    }

    if (!isJsonObject(json['installations'])) {
        throw new Error("Expected a json object 'installations'");
    }
    const installationsPage = modelIndexPageFromJsonObject(
        (item) => softwareInstallationFromJsonObject(item),
        json['installations']
    );

    if (typeof json['requiresLicense'] !== 'boolean') {
        throw new Error("Expected a boolean 'requiresLicense'")
    }

    if (typeof json['isPaidSoftware'] !== 'boolean') {
        throw new Error("Expected a boolean 'isPaidSoftware'");
    }

    return new Software({
        ...baseParams,
        name: json['name'],
        description: json['description'],
        tags: json['tags'],
        installationsPage,
        requiresLicense: json['requiresLicense'],
        isPaidSoftware: json['isPaidSoftware']
    });
}

export interface SoftwareQuery extends ModelQuery<Software> { }
function setSoftwareQueryParams(params: HttpParams, query: Partial<SoftwareQuery>) {
    params = setModelQueryParams(params, query);
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
    override readonly modelFromJsonObject = softwareFromJsonObject;
    override readonly setModelQueryParams = setSoftwareQueryParams;

    create(request: SoftwareCreateRequest) {
        return this._doCreate(
            softwareCreateRequestToJsonObject,
            request
        );
    }
}