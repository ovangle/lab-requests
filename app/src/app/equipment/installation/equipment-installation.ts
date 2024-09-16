import { validate as validateIsUUID } from 'uuid';

import { ModelQuery, modelId, ModelRef, isModelRef } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";
import { Lab } from '../../lab/lab';
import { NEVER, Observable, of, race, switchMap, timer } from 'rxjs';
import { Injectable, } from '@angular/core';
import { Equipment, EquipmentCreateRequest, EquipmentService, equipmentCreateRequestToJsonObject } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { LabInstallation, LabInstallationQuery, setLabInstallationQueryParams } from 'src/app/lab/common/installable/installation';
import { EquipmentProvision } from '../provision/equipment-provision';
import { ProvisionableCreateRequest } from 'src/app/lab/common/provisionable/provisionable';
import { EquipmentLease } from '../lease/equipment-lease';
import { isUUID } from 'src/app/utils/is-uuid';
import { RestfulService } from 'src/app/common/model/model-service';

export class EquipmentInstallation
    extends LabInstallation<Equipment, EquipmentProvision> {

    numInstalled: number;

    readonly equipmentId: string;
    get installableId() {
        return this.equipmentId;
    }
    readonly equipmentName: string;

    constructor(json: JsonObject) {
        super(EquipmentProvision, EquipmentLease, json);

        if (!isUUID(json['equipmentId'])) {
            throw new Error(`Expected a uuid 'equipmentId'`);
        }
        this.equipmentId = json['equipmentId'];

        if (typeof json['equipmentName'] !== 'string') {
            throw new Error(`Expected a string 'equipmentName'`);
        }
        this.equipmentName = json['equipmentName']

        if (typeof json['numInstalled'] !== 'number') {
            throw new Error("Expected a number 'numInstalled'");
        }
        this.numInstalled = json['numInstalled'];
    }
}

export interface EquipmentInstallationQuery extends LabInstallationQuery<Equipment, EquipmentInstallation> {
    equipment?: ModelRef<Equipment>;
}

export function setEquipmentInstallationQueryParams(params: HttpParams, query: EquipmentInstallationQuery) {
    params = setLabInstallationQueryParams(params, query, 'equipment');
    if (query.equipment) {
        params = params.set('equipment', modelId(query.equipment));
    }
    return params;
}

export interface EquipmentInstallationCreateRequest extends ProvisionableCreateRequest<EquipmentInstallation> {
    equipment?: ModelRef<Equipment> | EquipmentCreateRequest;
    lab: ModelRef<Lab>;
    numInstalled: number;
}

export function equipmentInstallationCreateRequestToJsonObject(
    request: EquipmentInstallationCreateRequest
): JsonObject {
    let equipment: JsonObject | string;
    if (isModelRef(request.equipment)) {
        equipment = modelId(request.equipment);
    } else {
        equipment = equipmentCreateRequestToJsonObject(request.equipment);
    }

    return {
        lab: modelId(request.lab),
        equipment
    };

}


@Injectable({ providedIn: 'root' })
export class EquipmentInstallationService extends RestfulService<EquipmentInstallation, EquipmentInstallationQuery> {
    readonly path = '/equipments/installation';
    override readonly model = EquipmentInstallation;
    override readonly setModelQueryParams = setEquipmentInstallationQueryParams;

    fetchForLabEquipment(lab: Lab | string, equipment: Equipment | string): Observable<EquipmentInstallation | null> {
        const labId = modelId(lab);
        const equipmentId = modelId(equipment);

        const fromCache = timer(0).pipe(
            switchMap(() => {
                for (const install of this._cache.values()) {
                    if (install.labId === labId && install.equipmentId === equipmentId) {
                        return of(install);
                    }
                }
                return NEVER;
            })
        )

        const fromServer = this.queryOne({ lab, equipment });
        return race(fromCache, fromServer);
    }
}