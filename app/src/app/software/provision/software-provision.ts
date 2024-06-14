import { LabProvision, LabProvisionApprovalRequest, LabProvisionCancellationRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionParams, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionApprovalRequestToJsonObject, labProvisionCreateRequestToJsonObject, labProvisionInstallRequestToJsonObject, labProvisionParamsFromJsonObject, setLabProvisionQueryParams } from "src/app/lab/common/provisionable/provision";
import { Software, SoftwareCreateRequest, SoftwareService, softwareFromJsonObject } from "../software";
import { SoftwareInstallation, SoftwareInstallationCreateRequest, SoftwareInstallationQuery, setSoftwareInstallationQueryParams, softwareInstallationCreateRequestToJsonObject, softwareInstallationFromJsonObject } from "../installation/software-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ModelCreateRequest, ModelRef, modelId, modelRefJsonDecoder } from "src/app/common/model/model";
import { Observable, firstValueFrom } from "rxjs";
import { Lab } from "src/app/lab/lab";
import { CostEstimate, costEstimateToJsonObject } from "src/app/research/funding/cost-estimate/cost-estimate";
import { User } from "src/app/user/common/user";

export type SoftwareProvisionType
    = 'new_software'
    | 'upgrade_software';


export interface SoftwareProvisionParams extends LabProvisionParams<SoftwareInstallation> {
    type: SoftwareProvisionType;
    software: ModelRef<Software>;

    minVersion: string;
    requiresLicense: boolean;
    isPaidSoftware: boolean;
}

export class SoftwareProvision extends LabProvision<SoftwareInstallation> {
    override readonly type: SoftwareProvisionType;
    software: ModelRef<Software>;

    minVersion: string;
    requiresLicense: boolean;
    isPaidSoftware: boolean;

    constructor(params: SoftwareProvisionParams) {
        super(params);
        this.software = params.software;
        this.type = params.type as any;

        this.minVersion = params.minVersion;
        this.requiresLicense = params.requiresLicense;
        this.isPaidSoftware = params.isPaidSoftware;
    }

    async resolveSoftware(service: SoftwareService) {
        if (typeof this.software === 'string') {
            this.software = await firstValueFrom(service.fetch(this.software));
        }
        return this.software;
    }
}

export function softwareProvisionFromJsonObject(json: JsonObject): SoftwareProvision {
    const baseParams = labProvisionParamsFromJsonObject(
        (type: string) => {
            if (![ 'new_software', 'upgrade_software' ].includes(type)) {
                throw new Error(`Expected a software provision type`);
            }
            return type as SoftwareProvisionType;
        },
        softwareInstallationFromJsonObject,
        json
    );

    const software = modelRefJsonDecoder(
        'software',
        softwareFromJsonObject,
    )(json);

    if (typeof json[ 'minVersion' ] !== 'string') {
        throw new Error('Expected a string `minVersion`');
    }

    if (typeof json[ 'requiresLicense' ] !== 'boolean') {
        throw new Error("Expected a boolean 'requiresLicense'");
    }
    if (typeof json[ 'isPaidSoftware' ] !== 'boolean') {
        throw new Error("Expected a boolean 'isPaidSoftware'");
    }

    return new SoftwareProvision({
        ...baseParams,
        software,
        minVersion: json[ 'minVersion' ],
        requiresLicense: json[ 'requiresLicense' ],
        isPaidSoftware: json[ 'isPaidSoftware' ]
    });
}

export interface SoftwareProvisionQuery extends LabProvisionQuery<SoftwareInstallation, SoftwareProvision, SoftwareInstallationQuery> {
    software?: ModelRef<Software>;
    pendingActionBy?: ModelRef<User>;
}

function setSoftwareProvisionQueryParams(params: HttpParams, query: Partial<SoftwareProvisionQuery>) {
    params = setLabProvisionQueryParams(params, query, setSoftwareInstallationQueryParams);

    if (query.software) {
        params = params.set('software', modelId(query.software));
    }

    return params;
}

interface _SoftwareProvisionCreateRequest extends LabProvisionCreateRequest<SoftwareInstallation, SoftwareProvision> {
    readonly type: SoftwareProvisionType;
}

export interface NewSoftwareRequest extends _SoftwareProvisionCreateRequest {
    readonly type: 'new_software';

    target: SoftwareInstallationCreateRequest;
    minVersion: string;
}

function newSoftwareRequestToJsonObject(request: NewSoftwareRequest): JsonObject {
    return {
        ...labProvisionCreateRequestToJsonObject(
            softwareInstallationCreateRequestToJsonObject,
            request
        ),
        minVersion: request.minVersion,
    }
}

export interface UpgradeSoftwareVersionRequest extends _SoftwareProvisionCreateRequest {
    readonly type: 'upgrade_software'
    readonly target: ModelRef<SoftwareInstallation>;
    minVersion: string;
}

function upgradeSoftwareVersionRequestToJsonObject(request: UpgradeSoftwareVersionRequest) {
    const baseRequest = labProvisionCreateRequestToJsonObject(
        (obj: never) => {
            throw new Error("unreachable");
        },
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

export interface SoftwareProvisionApprovalRequest extends LabProvisionApprovalRequest<SoftwareInstallation, SoftwareProvision> { }

function softwareProvisionApprovalRequestToJsonObject(request: SoftwareProvisionApprovalRequest) {
    return labProvisionApprovalRequestToJsonObject(request);
}

export interface SoftwareProvisionInstallRequest extends LabProvisionInstallRequest<SoftwareInstallation, SoftwareProvision> {
}
function softwareProvisionInstallRequestToJsonObject(request: SoftwareProvisionInstallRequest) {
    return labProvisionInstallRequestToJsonObject(request);
}

@Injectable()
export class SoftwareProvisionService extends LabProvisionService<SoftwareInstallation, SoftwareProvision, SoftwareProvisionQuery> {

    override readonly path = '/provisions';
    override readonly provisionableQueryParam: string = 'software';

    override readonly modelFromJsonObject = softwareProvisionFromJsonObject;
    override readonly setModelQueryParams = setSoftwareProvisionQueryParams;

    newSoftware(newSoftwareRequest: NewSoftwareRequest) {
        return this._doCreate(
            newSoftwareRequestToJsonObject,
            newSoftwareRequest
        )
    }

    upgradeVersion(upgradeSoftwareVersion: UpgradeSoftwareVersionRequest): Observable<SoftwareProvision> {
        return this._doCreate(
            upgradeSoftwareVersionRequestToJsonObject,
            upgradeSoftwareVersion
        );
    }

    override create<TRequest extends LabProvisionCreateRequest<SoftwareInstallation, SoftwareProvision>>(request: TRequest): Observable<SoftwareProvision> {
        switch (request.type) {
            case 'new_software':
                return this.newSoftware(request as any);
            case 'upgrade_software':
                return this.upgradeVersion(request as any);
            default:
                throw new Error(`Unrecognised software provision type ${request.type}`)
        }
    }

    protected override readonly _provisionApprovalRequestToJsonObject = softwareProvisionApprovalRequestToJsonObject;
    protected override readonly _provisionInstallRequestToJsonObject = softwareProvisionInstallRequestToJsonObject;

}