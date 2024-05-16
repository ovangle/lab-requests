import { validate as validateIsUUID } from 'uuid';

import { ModelParams, Model, modelParamsFromJsonObject, ModelQuery } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Lab, LabService, labFromJsonObject } from '../../lab/lab';
import { NEVER, Observable, firstValueFrom, map, of, race, switchMap, timer } from 'rxjs';
import { Injectable, Type, inject } from '@angular/core';
import { EquipmentContext } from '../equipment-context';
import { Equipment, EquipmentService, equipmentFromJsonObject } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { RelatedModelService } from 'src/app/common/model/context';
import { ProvisionStatus, isProvisionStatus } from 'src/app/lab/common/provisionable/provision-status';

export interface EquipmentInstallationParams extends ModelParams {
    equipmentName: string;
    equipment: Equipment | string;
    lab: Lab | string;
    numInstalled: number;
    provisionStatus: ProvisionStatus;
}

export class EquipmentInstallation extends Model implements EquipmentInstallationParams {
    equipmentName: string;
    equipment: Equipment | string;
    get equipmentId(): string {
        return (this.equipment instanceof Equipment) ? this.equipment.id : this.equipment;
    }

    lab: Lab | string;
    get labId() { return (this.lab instanceof Lab) ? this.lab.id : this.lab; }

    numInstalled: number;
    provisionStatus: ProvisionStatus;

    constructor(params: EquipmentInstallationParams) {
        super(params);
        this.equipmentName = params.equipmentName;
        this.equipment = params.equipment;
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
        return [ 'requested', 'approved', 'purchased', 'installed' ].includes(this.provisionStatus);
    }

    get isPendingApproval() {
        return [ 'requested' ].includes(this.provisionStatus);
    }

    get isApproved() {
        return [ 'installed', 'purchased', 'approved' ].includes(this.provisionStatus);
    }

    get isPendingPurchase() {
        return [ 'requested', 'approved' ].includes(this.provisionStatus);
    }

    get isPurchased() {
        return [ 'installed', 'purchased' ].includes(this.provisionStatus);
    }

    get isPendingInstallation() {
        return [ 'requested', 'improved', 'purchase' ].includes(this.provisionStatus);
    }

    get isInstalled() {
        return [ 'installed' ].includes(this.provisionStatus);
    }

}


export function equipmentInstallationFromJsonObject(obj: JsonObject): EquipmentInstallation {
    const baseParams = modelParamsFromJsonObject(obj);

    let equipment: Equipment | string;

    if (isJsonObject(obj[ 'equipment' ])) {
        equipment = equipmentFromJsonObject(obj[ 'equipment' ]);
    } else if (typeof obj[ 'equipment' ] === 'string') {
        equipment = obj[ 'equipment' ];
    } else {
        throw new Error("Expected a json object or string 'equipment'");
    }

    if (typeof obj[ 'equipmentName' ] !== 'string') {
        throw new Error("Expected a string 'equipmentName'");
    }

    let lab: Lab | string;
    if (typeof obj[ 'lab' ] === 'string' && validateIsUUID(obj[ 'lab' ])) {
        lab = obj[ 'lab' ];
    } else if (isJsonObject(obj[ 'lab' ])) {
        lab = labFromJsonObject(obj[ 'lab' ]);
    } else {
        throw new Error("Expected a string or json object 'lab'")
    }
    if (typeof obj[ 'numInstalled' ] !== 'number') {
        throw new Error('Expected a number numInstalled');
    }
    if (!isProvisionStatus(obj[ 'provisionStatus' ])) {
        throw new Error("Expected a provision status 'provisionStatus");
    }

    return new EquipmentInstallation({
        ...baseParams,
        equipment,
        equipmentName: obj[ 'equipmentName' ],
        lab,
        numInstalled: obj[ 'numInstalled' ],
        provisionStatus: obj[ 'provisionStatus' ]
    });
}

export interface EquipmentInstallationQuery extends ModelQuery<EquipmentInstallation> {
    equipment?: Equipment | string;
    lab?: Lab | string;
}

function equipmentInstallationQueryToHttpParams(query: EquipmentInstallationQuery) {
    let params = new HttpParams();
    const equipmentId = typeof query.equipment === 'string' ? query.equipment : query.equipment?.id;
    if (equipmentId) {
        params = params.set('equipment', equipmentId);
    }
    const labId = typeof query.lab === 'string' ? query.lab : query.lab?.id;
    if (labId) {
        params = params.set('lab', labId);
    }

    return params;
}

@Injectable()
export class EquipmentInstallationService extends RelatedModelService<Equipment, EquipmentInstallation, EquipmentInstallationQuery> {
    override readonly context = inject(EquipmentContext);
    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
    override readonly modelQueryToHttpParams = equipmentInstallationQueryToHttpParams;
    override readonly path = 'installations';
    readonly equipment$ = this.context.committed$;

    fetchForLabEquipment(lab: Lab | string, equipment: Equipment | string): Observable<EquipmentInstallation | null> {
        const labId = typeof lab === 'string' ? lab : lab.id;
        const equipmentId = typeof equipment === 'string' ? equipment : equipment.id;

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

        const fromServer = this.queryOne({ lab: labId, equipment: equipmentId });
        return race(fromCache, fromServer);
    }
}