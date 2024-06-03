import { validate as validateIsUUID } from 'uuid';

import { ModelParams, Model, modelParamsFromJsonObject, ModelQuery, modelId, ModelRef, isModelRef } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Lab, LabService, labFromJsonObject } from '../../lab/lab';
import { NEVER, Observable, firstValueFrom, map, of, race, switchMap, timer } from 'rxjs';
import { Injectable, Type, inject } from '@angular/core';
import { EquipmentContext } from '../equipment-context';
import { Equipment, EquipmentCreateRequest, EquipmentService, equipmentCreateRequestToJsonObject, equipmentFromJsonObject } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { RelatedModelService } from 'src/app/common/model/context';
import { LabInstallation, LabInstallationParams, LabInstallationQuery, labInstallationParamsFromJsonObject, setLabInstallationQueryParams } from 'src/app/lab/common/installable/installation';
import { EquipmentProvision, equipmentProvisionFromJsonObject } from '../provision/equipment-provision';
import { ProvisionableCreateRequest } from 'src/app/lab/common/provisionable/provisionable';

export interface EquipmentInstallationParams extends LabInstallationParams<Equipment, EquipmentProvision> {
    numInstalled: number;
}

export class EquipmentInstallation
    extends LabInstallation<Equipment, EquipmentProvision>
    implements EquipmentInstallationParams {

    numInstalled: number;

    get equipment() { return this.installable; }

    constructor(params: EquipmentInstallationParams) {
        super(params);
        this.lab = params.lab;
        this.numInstalled = params.numInstalled;
    }

    resolveEquipment(using: EquipmentService) {
        return this.resolveInstallable(using);
    }
}

export function equipmentInstallationFromJsonObject(json: JsonObject): EquipmentInstallation {
    const baseParams = labInstallationParamsFromJsonObject(
        equipmentFromJsonObject,
        equipmentProvisionFromJsonObject,
        'equipment',
        json
    );

    if (typeof json['numInstalled'] !== 'number') {
        throw new Error(`Expected a number 'numInstalled'`);
    }

    return new EquipmentInstallation({
        ...baseParams,
        numInstalled: json['numInstalled']
    });
}

export interface EquipmentInstallationQuery extends LabInstallationQuery<Equipment, EquipmentInstallation> {
    equipment?: ModelRef<Equipment>;
}

function setEquipmentInstallationQueryParams(params: HttpParams, query: EquipmentInstallationQuery) {
    params = setLabInstallationQueryParams(params, query, 'equipment');
    if (query.equipment) {
        params = params.set('equipment', modelId(query.equipment));
    }
    return params;
}

export interface EquipmentInstallationCreateRequest extends ProvisionableCreateRequest<EquipmentInstallation> {
    equipment: ModelRef<Equipment> | EquipmentCreateRequest;
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


@Injectable()
export class EquipmentInstallationService extends RelatedModelService<Equipment, EquipmentInstallation, EquipmentInstallationQuery> {
    override readonly context = inject(EquipmentContext);
    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
    override readonly setModelQueryParams = setEquipmentInstallationQueryParams;

    override readonly path = 'installations';
    readonly equipment$ = this.context.committed$;

    fetchForLabEquipment(lab: Lab | string, equipment: Equipment | string): Observable<EquipmentInstallation | null> {
        const labId = modelId(lab);
        const equipmentId = modelId(equipment);

        const fromCache = timer(0).pipe(
            switchMap(() => {
                for (const install of this._cache.values()) {
                    if (modelId(install.lab) === labId && modelId(install.equipment) === equipmentId) {
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