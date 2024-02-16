import { validate as validateIsUUID } from 'uuid';

import { ModelParams, Model, modelParamsFromJsonObject, ModelIndexPage, ModelPatch } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ProvisionStatus, isProvisionStatus } from "../../lab/equipment/provision/provision-status";
import { Lab, LabService, labFromJsonObject } from '../../lab/lab';
import { Observable, first, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { Injectable, Type, inject } from '@angular/core';
import { ModelService, RestfulService } from 'src/app/common/model/model-service';
import { EquipmentContext } from '../equipment-context';
import { Equipment, EquipmentService } from '../equipment';
import { HttpParams } from '@angular/common/http';
import urlJoin from 'url-join';
import { RelatedModelService } from 'src/app/common/model/context';

export interface EquipmentInstallationParams extends ModelParams {
    equipmentName: string;
    equipmentId: string;
    equipment: Equipment | string;
    labId: string;
    lab: Lab | string;
    numInstalled: number;
    provisionStatus: ProvisionStatus;
}

export class EquipmentInstallation extends Model implements EquipmentInstallationParams {
    equipmentName: string;
    equipmentId: string;
    equipment: Equipment | string;

    labId: string;
    lab: Lab | string;

    numInstalled: number;
    provisionStatus: string;

    constructor(params: EquipmentInstallationParams) {
        super(params);
        this.equipmentName = params.equipmentName;
        this.equipmentId = params.equipmentId;
        this.equipment = params.equipment;
        this.labId = params.labId;
        this.lab = params.lab;
        this.numInstalled = params.numInstalled;
        this.provisionStatus = params.provisionStatus;
    }

    async resolveEquipment(equipments: EquipmentService): Promise<Equipment> {
        if (typeof this.equipment === 'string') {
            this.equipment = await firstValueFrom(equipments.fetch(this.equipmentId));
        }
        return this.equipment as Equipment;
    }

    async resolveLab(labs: LabService): Promise<Lab> {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(labs.fetch(this.lab));
        }
        return this.lab as Lab;
    }

    get isRequested() {
        return ['requested', 'approved', 'purchased', 'installed'].includes(this.provisionStatus);
    }

    get isPendingApproval() {
        return ['requested'].includes(this.provisionStatus);
    }

    get isApproved() {
        return ['installed', 'purchased', 'approved'].includes(this.provisionStatus);
    }

    get isPendingPurchase() {
        return ['requested', 'approved'].includes(this.provisionStatus);
    }

    get isPurchased() {
        return ['installed', 'purchased'].includes(this.provisionStatus);
    }

    get isPendingInstallation() {
        return ['requested', 'improved', 'purchase'].includes(this.provisionStatus);
    }

    get isInstalled() {
        return ['installed'].includes(this.provisionStatus);
    }

}


export function equipmentInstallationFromJsonObject(obj: JsonObject): EquipmentInstallation {
    const baseParams = modelParamsFromJsonObject(obj);
    if (typeof obj['equipmentId'] !== 'string' || !validateIsUUID(obj['equipmentId'])) {
        throw new Error("Expected a uuid 'equipmentId")
    }
    if (typeof obj['equipmentName'] !== 'string') {
        throw new Error("Expected a string 'equipmentName'")
    }
    let labId: string;
    let lab: Lab | string;
    if (typeof obj['lab'] === 'string' && validateIsUUID(obj['lab'])) {
        labId = lab = obj['lab'];
    } else if (isJsonObject(obj['lab'])) {
        lab = labFromJsonObject(obj['lab']);
        labId = lab.id;
    } else {
        throw new Error("Expected a string or json object 'lab'")
    }
    if (typeof obj['numInstalled'] !== 'number') {
        throw new Error('Expected a number numInstalled');
    }
    if (!isProvisionStatus(obj['provisionStatus'])) {
        throw new Error("Expected a provision status 'provisionStatus");
    }

    return new EquipmentInstallation({
        ...baseParams,
        equipmentName: obj['equipmentName'],
        equipmentId: obj['equipmentId'],
        equipment: obj['equipmentId'],
        labId,
        lab,
        numInstalled: obj['numInstalled'],
        provisionStatus: obj['provisionStatus']
    });
}

@Injectable()
export class EquipmentInstallationService extends RelatedModelService<Equipment, EquipmentInstallation> {
    override readonly context = inject(EquipmentContext);
    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
    readonly equipment$ = this.context.committed$;
}