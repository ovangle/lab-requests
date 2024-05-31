import { LabProvision, LabProvisionApprovalRequest, LabProvisionCancellationRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionParams, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionCreateRequestToJsonObject, labProvisionParamsFromJsonObject, provisionApprovalRequestToJsonObject, provisionInstallRequestToJsonObject, provisionPurchaseRequestToJsonObject } from "src/app/lab/common/provisionable/provision";
import { Software } from "../software";
import { SoftwareInstallation, softwareInstallationFromJsonObject } from "../installation/software-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ModelCreateRequest, ModelRef, modelId } from "src/app/common/model/model";
import { Observable } from "rxjs";



export interface SoftwareProvisionParams extends LabProvisionParams<SoftwareInstallation> { }

export class SoftwareProvision extends LabProvision<SoftwareInstallation> {
    override readonly type: 'new_software' | 'upgrade_software';
    constructor(params: SoftwareProvisionParams) {
        super(params);
        this.type = params.type as any;
    }
}

export function softwareProvisionFromJsonObject(json: JsonObject): SoftwareProvision {
    const baseParams = labProvisionParamsFromJsonObject<SoftwareInstallation>(
        (type: string) => {
            if (!['new_software', 'upgrade_software'].includes(type)) {
                throw new Error(`Expected a software provision type`);
            }
            return type;
        },
        softwareInstallationFromJsonObject,
        json
    );

    return new SoftwareProvision({ ...baseParams });
}

export interface SoftwareProvisionQuery extends LabProvisionQuery<SoftwareInstallation, SoftwareProvision> {
}

function softwareProvisionQueryToHttpParams(query: SoftwareProvisionQuery) {
    let params = new HttpParams();
    return params;
}

export interface NewSoftwareRequest extends LabProvisionCreateRequest<SoftwareInstallation, SoftwareProvision> {
    readonly type: 'new_software';

    software: ModelRef<Software>;
    minVersion: string;
    requiresPaidLicense: boolean;
    isInstalledInGeneralLab: boolean;
}

function newSoftwareRequestToJsonObject(request: NewSoftwareRequest) {
    return labProvisionCreateRequestToJsonObject(request);
}

export interface UpgradeSoftwareVersionRequest extends LabProvisionCreateRequest<SoftwareInstallation, SoftwareProvision> {
    readonly type: 'upgrade_software'
    currentInstallation: ModelRef<SoftwareInstallation>;
    minVersion: string;
}

function upgradeSoftwareRequestToJsonObject(request: UpgradeSoftwareVersionRequest) {
    const baseRequest = labProvisionCreateRequestToJsonObject(request);
    return {
        ...baseRequest,
        currentInstallation: modelId(request.currentInstallation),
        minVersion: request.minVersion
    };
}

export interface SoftwareProvisionApprovalRequest extends LabProvisionApprovalRequest<SoftwareInstallation, SoftwareProvision> { }


function softwareProvisionApprovalRequestToJsonObject(request: SoftwareProvisionApprovalRequest) {
    return provisionApprovalRequestToJsonObject(request);
}

export interface SoftwareProvisionPurchaseRequest extends LabProvisionPurchaseRequest<SoftwareInstallation, SoftwareProvision> { }

function softwareProvisionPurchaseRequestToJsonObject(request: SoftwareProvisionPurchaseRequest) {
    return provisionPurchaseRequestToJsonObject(request);
}

export interface SoftwareProvisionInstallRequest extends LabProvisionInstallRequest<SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionInstallRequestToJsonObject(request: SoftwareProvisionInstallRequest) {
    return provisionInstallRequestToJsonObject(request);
}

export interface SoftwareProvisionCancellationRequest extends LabProvisionCancellationRequest<SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionCancellationRequestToJsonObject(request: SoftwareProvisionCancellationRequest) {
    return softwareProvisionCancellationRequestToJsonObject(request);
}

@Injectable()
export class SoftwareProvisionService extends LabProvisionService<SoftwareInstallation, SoftwareProvision> {
    override readonly path = '/software';
    override readonly provisionableQueryParam: string = 'software';

    override readonly modelFromJsonObject = softwareProvisionFromJsonObject;
    override readonly modelQueryToHttpParams = softwareProvisionQueryToHttpParams;

    protected override readonly approvalRequestToJsonObject = softwareProvisionApprovalRequestToJsonObject;
    protected override readonly purchaseRequestToJsonObject = softwareProvisionPurchaseRequestToJsonObject;
    protected override readonly installRequestToJsonObject = softwareProvisionInstallRequestToJsonObject;
    protected override readonly cancellationRequestToJsonObject = softwareProvisionCancellationRequestToJsonObject;

    protected _create<T extends ModelCreateRequest<SoftwareInstallation>>(
        requestToJsonObject: (request: T) => JsonObject,
        request: T
    ): Observable<SoftwareInstallation>

    newSoftware(newSoftwareRequest: NewSoftwareRequest) {
        return this._create(
            newSoftwareRequestToJsonObject,
            newSoftwareRequest
        )
    }

    upgradeVersion(upgradeSoftwareVersion: UpgradeSoftwareVersionRequest): Observable<SoftwareProvision> {
        return this._create(
            upgradeSoftwareVersionToJsonObject,
            upgradeSoftwareVersion
        );
    }

}