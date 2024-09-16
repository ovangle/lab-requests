import { Model, ModelFactory, ModelQuery } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";
import { EquipmentInstallation } from "../installation/equipment-installation";
import { LabAllocation, LabAllocationCreateRequest, labAllocationCreateRequestToJsonObject } from "src/app/lab/common/allocatable/lab-allocation";
import { isUUID } from "src/app/utils/is-uuid";
import { Injectable } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { EquipmentTrainingAcknowlegementComponent } from "../training/training-acknowlegment-input.component";


export class EquipmentLease extends LabAllocation<EquipmentInstallation> {
    equipmentId: string;
    equipmentName: string;
    installationId: string;

    numRequired: number;
    equipmentTrainingAcknowledgements: string[];

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['equipmentId'])) {
            throw new Error(`Expected a uuid 'equipmentId'`);
        }
        this.equipmentId = json['equipmentId'];

        if (typeof json['equipmentName'] !== 'string') {
            throw new Error(`Expected a string 'equipmentName'`);
        }
        this.equipmentName = json['equipmentName'];

        if (!isUUID(json['installationId'])) {
            throw new Error("Expected a uuid 'installationId'");
        }
        this.installationId = json['installationId'];

        if (typeof json['numRequired'] !== 'number') {
            throw new Error(`Expected a number 'numRequired'`);
        }
        this.numRequired = json['numRequired'];

        if (!Array.isArray(json['equipmentTrainingAcknowledgements'])
            || json['equipmentTrainingAcknowledgements'].some(item => typeof item !== 'string')) {
            throw new Error(`Expected a list of strings 'equipmentTrainingAcknowledged'`);
        }
        this.equipmentTrainingAcknowledgements = json['equipmentTrainingAcknowledgements'];
    }
}

export interface EquipmentLeaseQuery extends ModelQuery<EquipmentLease> {
    installation: string;
}



export interface CreateEquipmentLease extends LabAllocationCreateRequest<EquipmentLease> {
    numRequired: number;
    equipmentTrainingAcknowledgements: string[];
}

export function createEquipmentLeaseToJsonObject(request: CreateEquipmentLease) {
    const json = labAllocationCreateRequestToJsonObject(request);

    return {
        ...json,
        numRequired: request.numRequired,
        equipmentTrainingAcknowledgements: request.equipmentTrainingAcknowledgements
    }
}

@Injectable({ providedIn: 'root' })
export class EquipmentLeaseService extends RestfulService<EquipmentLease, EquipmentLeaseQuery> {
    override readonly model = EquipmentLease;
    override readonly path = '/equipment/equipment-lease';

    override setModelQueryParams(params: HttpParams, lookup: EquipmentLeaseQuery): HttpParams {
        if (lookup) {
            params = params.set('installation', lookup.installation);
        }
        return params;
    }

    create(request: CreateEquipmentLease) {
        return this._doCreate(
            createEquipmentLeaseToJsonObject,
            request
        );
    }
}