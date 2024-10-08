import { validate as validateIsUUID } from 'uuid';

import { ModelQuery, modelId, ModelRef, isModelRef, ModelUpdateRequest } from "src/app/common/model/model";
import { JsonObject } from "src/app/utils/is-json-object";
import { Lab } from '../../lab/lab';
import { map, NEVER, Observable, of, race, switchMap, tap, timer } from 'rxjs';
import { inject, Injectable, } from '@angular/core';
import { Equipment, EquipmentCreateRequest, EquipmentService, equipmentCreateRequestToJsonObject } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { LabInstallation, LabInstallationQuery, setLabInstallationQueryParams } from 'src/app/lab/common/installable/installation';
import { EquipmentInstallationProvision, EquipmentProvisionService, EquipmentTransferProvision, EquipmentTransferRequest, NewEquipmentProvision, NewEquipmentRequest, newEquipmentRequestToJsonObject, transferEquipmentRequestToJsonObject } from '../provision/equipment-provision';
import { ProvisionableCreateRequest, ProvisionableModelService } from 'src/app/lab/common/provisionable/provisionable';
import { EquipmentLease } from '../lease/equipment-lease';
import { isUUID } from 'src/app/utils/is-uuid';
import { RestfulService } from 'src/app/common/model/model-service';
import urlJoin from 'url-join';

export class EquipmentInstallation
    extends LabInstallation<Equipment, EquipmentInstallationProvision> {

    installedModelName: string;
    numInstalled: number;

    readonly equipmentId: string;
    get installableId() {
        return this.equipmentId;
    }
    readonly equipmentName: string;

    constructor(json: JsonObject) {
        super(EquipmentInstallationProvision, EquipmentLease, json);

        if (!isUUID(json['equipmentId'])) {
            throw new Error(`Expected a uuid 'equipmentId'`);
        }
        this.equipmentId = json['equipmentId'];

        if (typeof json['equipmentName'] !== 'string') {
            throw new Error(`Expected a string 'equipmentName'`);
        }
        this.equipmentName = json['equipmentName']

        if (typeof json['installedModelName'] !== 'string') {
            throw new Error(`Expected a string 'modelName'`);
        }
        this.installedModelName = json['installedModelName'];

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

export interface EquipmentInstallationRequest extends ProvisionableCreateRequest<EquipmentInstallation>, ModelUpdateRequest<EquipmentInstallation> {
    equipment?: ModelRef<Equipment> | EquipmentCreateRequest;
    lab?: ModelRef<Lab>;
    modelName?: string;
    numInstalled: number;
}

export function equipmentInstallationCreateRequestToJsonObject(
    request: EquipmentInstallationRequest
): JsonObject {
    let equipment: JsonObject | string;
    if (isModelRef(request.equipment)) {
        equipment = modelId(request.equipment);
    } else {
        equipment = equipmentCreateRequestToJsonObject(request.equipment);
    }

    return {
        lab: request.lab ? modelId(request.lab) : undefined,
        equipment,
        numInstalled: request.numInstalled,
        modelName: request.modelName
    };
}
export type EquipmentInstallationProvisionAction
    = 'new_equipment'
    | 'transfer_equipment';

export function isEquipmentInstallationProvisionAction(obj: unknown): obj is EquipmentInstallationProvisionAction {
    return obj === 'new_equipment' || obj === 'transfer_equipment';
}



@Injectable({ providedIn: 'root' })
export class EquipmentInstallationService extends ProvisionableModelService<EquipmentInstallation, EquipmentInstallationQuery> {
    readonly path = '/equipments/installation';
    override readonly model = EquipmentInstallation;
    override readonly setModelQueryParams = setEquipmentInstallationQueryParams;

    override provisionFromJsonObject(json: JsonObject) {
        if (!isEquipmentInstallationProvisionAction(json['action']))
            throw new Error(`Expected an equipment installation provision action 'action'`);

        switch (json['action']) {
            case 'new_equipment':
                return new NewEquipmentProvision(json);
            case 'transfer_equipment':
                return new EquipmentTransferProvision(json);
        }
    }

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

    create(request: EquipmentInstallationRequest): Observable<EquipmentInstallation> {
        if (request.lab == undefined) {
            throw new Error('Lab is required for create request');
        }

        return this._doCreate(
            equipmentInstallationCreateRequestToJsonObject,
            request
        );
    }

    update(installation: ModelRef<EquipmentInstallation>, request: EquipmentInstallationRequest): Observable<EquipmentInstallation> {
        return this._doUpdate(
            installation,
            equipmentInstallationCreateRequestToJsonObject,
            request
        );
    }

    /**
     * Create a provision to add new equipment instances to the installation
     * @param installation
     * @param request
     * @returns
     */
    newEquipment(request: NewEquipmentRequest): Observable<NewEquipmentProvision>;
    newEquipment(installation: ModelRef<EquipmentInstallation>, request: NewEquipmentRequest): Observable<NewEquipmentProvision>;

    newEquipment(arg1: ModelRef<EquipmentInstallation> | NewEquipmentRequest, arg2?: NewEquipmentRequest): Observable<NewEquipmentProvision> {
        if (arg2 === undefined) {
            return this.createProvision<NewEquipmentProvision>('new_equipment', newEquipmentRequestToJsonObject(arg1 as NewEquipmentRequest));
        } else {
            return this.createProvision<NewEquipmentProvision>('new_equipment', arg1 as ModelRef<EquipmentInstallation>, newEquipmentRequestToJsonObject(arg2));
        }
    }

    /**
     * Create a provision to transfer equipment instances from the specified installation
     * @param request
     * @returns
     */
    transferEquipment(installation: ModelRef<EquipmentInstallation>, request: EquipmentTransferRequest) {
        return this.createProvision(
            'transfer_equipment',
            installation,
            transferEquipmentRequestToJsonObject(request)
        );
    }
}