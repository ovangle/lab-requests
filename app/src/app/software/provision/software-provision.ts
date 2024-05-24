import { LabProvision, LabProvisionApprovalRequest, LabProvisionCancellationRequest, LabProvisionCreateRequest, LabProvisionInstallRequest, LabProvisionParams, LabProvisionPurchaseRequest, LabProvisionQuery, LabProvisionService, labProvisionCreateRequestToJsonObject, labProvisionParamsFromJsonObject, provisionApprovalRequestToJsonObject, provisionInstallRequestToJsonObject, provisionPurchaseRequestToJsonObject } from "src/app/lab/common/provisionable/provision";
import { Software } from "../software";
import { SoftwareInstallation, softwareInstallationFromJsonObject } from "../installation/software-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";



export interface SoftwareProvisionParams extends LabProvisionParams<Software, SoftwareInstallation> { }

export class SoftwareProvision extends LabProvision<Software, SoftwareInstallation> {
    constructor(params: SoftwareProvisionParams) {
        super(params);
    }
}

export function softwareProvisionFromJsonObject(json: JsonObject): SoftwareProvision {
    const baseParams = labProvisionParamsFromJsonObject<Software, SoftwareInstallation>(
        softwareInstallationFromJsonObject,
        json
    );

    return new SoftwareProvision({ ...baseParams });
}

export interface SoftwareProvisionQuery extends LabProvisionQuery<Software, SoftwareInstallation, SoftwareProvision> {
}

function softwareProvisionQueryToHttpParams(query: SoftwareProvisionQuery) {
    let params = new HttpParams();
    return params;
}

export interface SoftwareProvisionCreateRequest extends LabProvisionCreateRequest<Software, SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionCreateRequestToJsonObject(request: SoftwareProvisionCreateRequest) {
    return labProvisionCreateRequestToJsonObject(request);
}

export interface SoftwareProvisionApprovalRequest extends LabProvisionApprovalRequest<Software, SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionApprovalRequestToJsonObject(request: SoftwareProvisionApprovalRequest) {
    return provisionApprovalRequestToJsonObject(request);
}

export interface SoftwareProvisionPurchaseRequest extends LabProvisionPurchaseRequest<Software, SoftwareInstallation, SoftwareProvision> {

}

function softwareProvisionPurchaseRequestToJsonObject(request: SoftwareProvisionPurchaseRequest) {
    return provisionPurchaseRequestToJsonObject(request);
}

export interface SoftwareProvisionInstallRequest extends LabProvisionInstallRequest<Software, SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionInstallRequestToJsonObject(request: SoftwareProvisionInstallRequest) {
    return provisionInstallRequestToJsonObject(request);
}

export interface SoftwareProvisionCancellationRequest extends LabProvisionCancellationRequest<Software, SoftwareInstallation, SoftwareProvision> {

}
function softwareProvisionCancellationRequestToJsonObject(request: SoftwareProvisionCancellationRequest) {
    return softwareProvisionCancellationRequestToJsonObject(request);
}

@Injectable()
export class SoftwareProvisionService extends LabProvisionService<Software, SoftwareInstallation, SoftwareProvision> {
    override readonly path = '/software';
    override readonly provisionableQueryParam: string = 'software';

    override readonly modelFromJsonObject = softwareProvisionFromJsonObject;
    override readonly modelQueryToHttpParams = softwareProvisionQueryToHttpParams;

    override readonly createToJsonObject = softwareProvisionCreateRequestToJsonObject;

    protected override readonly approvalRequestToJsonObject = softwareProvisionApprovalRequestToJsonObject;
    protected override readonly purchaseRequestToJsonObject = softwareProvisionPurchaseRequestToJsonObject;
    protected override readonly installRequestToJsonObject = softwareProvisionInstallRequestToJsonObject;
    protected override readonly cancellationRequestToJsonObject = softwareProvisionCancellationRequestToJsonObject;

}