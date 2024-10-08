import { LabProvision, LabProvisionApprovalRequest, LabProvisionCancellationRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionApprovalRequestToJsonObject, labProvisionCreateRequestToJsonObject, labProvisionInstallRequestToJsonObject, setLabProvisionQueryParams } from "src/app/lab/common/provisionable/provision";
import { Software, SoftwareCreateRequest, SoftwareService } from "../software";
import { SoftwareInstallation, SoftwareInstallationCreateRequest, SoftwareInstallationQuery, setSoftwareInstallationQueryParams, softwareInstallationCreateRequestToJsonObject } from "../installation/software-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ModelCreateRequest, ModelRef, modelId, modelRefFromJson } from "src/app/common/model/model";
import { Observable, firstValueFrom } from "rxjs";
import { Lab } from "src/app/lab/lab";
import { User } from "src/app/user/user";
import { isUUID } from "src/app/utils/is-uuid";
import { LabInstallationProvision } from "src/app/lab/common/installable/installation";

export type SoftwareProvisionType
    = 'new_software'
    | 'upgrade_software';

export class SoftwareInstallationProvision extends LabInstallationProvision<SoftwareInstallation> {
    softwareId: string;

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['softwareId'])) {
            throw new Error(`Expected a uuid 'softwareId'`);
        }
        this.softwareId = json['softwareId'];
    }
}


export interface SoftwareProvisionQuery extends LabProvisionQuery<SoftwareInstallation, SoftwareInstallationProvision, SoftwareInstallationQuery> {
    software?: ModelRef<Software>;
    pendingActionBy?: ModelRef<User>;
}

function setSoftwareProvisionQueryParams(params: HttpParams, query: Partial<SoftwareProvisionQuery>) {
    params = setLabProvisionQueryParams(params, query);

    if (query.software) {
        params = params.set('software', modelId(query.software));
    }

    return params;
}

interface _SoftwareProvisionCreateRequest extends LabProvisionCreateRequest<SoftwareInstallation, SoftwareInstallationProvision> {
    readonly type: SoftwareProvisionType;
}

export class NewSoftwareProvision extends SoftwareInstallationProvision {
    minVersion: string;
    requiresLicense: boolean;
    isPaidSoftware: boolean;

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['minVersion'] !== 'string') {
            throw new Error('Expected a string `minVersion`');
        }
        this.minVersion = json['minVersion'];

        if (typeof json['requiresLicense'] !== 'boolean') {
            throw new Error("Expected a boolean 'requiresLicense'");
        }
        this.requiresLicense = json['requiresLicense'];
        if (typeof json['isPaidSoftware'] !== 'boolean') {
            throw new Error("Expected a boolean 'isPaidSoftware'");
        }
        this.isPaidSoftware = json['isPaidSoftware'];

    }
}

export interface NewSoftwareRequest extends _SoftwareProvisionCreateRequest {
    readonly type: 'new_software';

    target: SoftwareInstallationCreateRequest;
    minVersion: string;
}

function newSoftwareRequestToJsonObject(request: NewSoftwareRequest): JsonObject {
    return {
        ...labProvisionCreateRequestToJsonObject(
            request
        ),
        minVersion: request.minVersion,
    }
}

export class UpgradeSoftwareProvision extends SoftwareInstallationProvision {
    minVersion: string;

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['minVersion'] !== 'string') {
            throw new Error(`Expected a string 'minVersion'`);
        }
        this.minVersion = json['minVersion'];
    }
}

export interface UpgradeSoftwareVersionRequest extends _SoftwareProvisionCreateRequest {
    readonly type: 'upgrade_software'
    readonly target: ModelRef<SoftwareInstallation>;
    minVersion: string;
}

function upgradeSoftwareVersionRequestToJsonObject(request: UpgradeSoftwareVersionRequest) {
    const baseRequest = labProvisionCreateRequestToJsonObject(
        request
    );
    return {
        ...baseRequest,
        minVersion: request.minVersion
    };
}


export type SoftwareProvisionCreateRequest
    = NewSoftwareRequest
    | UpgradeSoftwareVersionRequest;

export interface SoftwareProvisionApprovalRequest extends LabProvisionApprovalRequest<SoftwareInstallation, SoftwareInstallationProvision> { }

function softwareProvisionApprovalRequestToJsonObject(request: SoftwareProvisionApprovalRequest) {
    return labProvisionApprovalRequestToJsonObject(request);
}

export interface SoftwareProvisionInstallRequest extends LabProvisionInstallRequest<SoftwareInstallation, SoftwareInstallationProvision> {
}
function softwareProvisionInstallRequestToJsonObject(request: SoftwareProvisionInstallRequest) {
    return labProvisionInstallRequestToJsonObject(request);
}

@Injectable()
export class SoftwareProvisionService extends LabProvisionService<SoftwareInstallation, SoftwareInstallationProvision, SoftwareProvisionQuery> {

    override readonly path = '/provisions';
    override readonly provisionableQueryParam: string = 'software';

    override readonly model = SoftwareInstallationProvision;
    override readonly setModelQueryParams = setSoftwareProvisionQueryParams;

    newSoftware(newSoftwareRequest: NewSoftwareRequest) {
        return this._doCreate(
            newSoftwareRequestToJsonObject,
            newSoftwareRequest
        )
    }

    upgradeVersion(upgradeSoftwareVersion: UpgradeSoftwareVersionRequest): Observable<SoftwareInstallationProvision> {
        return this._doCreate(
            upgradeSoftwareVersionRequestToJsonObject,
            upgradeSoftwareVersion
        );
    }

    protected override readonly _provisionApprovalRequestToJsonObject = softwareProvisionApprovalRequestToJsonObject;
    protected override readonly _provisionInstallRequestToJsonObject = softwareProvisionInstallRequestToJsonObject;

}