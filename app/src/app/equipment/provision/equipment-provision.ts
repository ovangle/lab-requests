import { Model, ModelIndexPage, ModelParams, ModelPatch, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, EquipmentCreateRequest, labEquipmentCreateRequestToJson, equipmentFromJsonObject, EquipmentPatch, EquipmentService } from "../equipment";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { Lab } from "../../lab/lab";
import { Observable, first, firstValueFrom, map, shareReplay, switchMap } from "rxjs";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "../installation/equipment-installation";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ModelService } from "src/app/common/model/model-service";
import urlJoin from "url-join";
import { EquipmentContext } from "../equipment-context";
import { RelatedModelService } from "src/app/common/model/context";
import { Discipline } from "src/app/uni/discipline/discipline";

export interface LabEquipmentProvisionParams extends ModelParams {
    status: ProvisionStatus;
    equipmentId: string;
    equipment: Equipment | null;
    installation: EquipmentInstallation | null;
    reason: string;
}

export class LabEquipmentProvision extends Model implements LabEquipmentProvisionParams {
    status: ProvisionStatus;
    equipmentId: string;
    equipment: Equipment | null;
    installation: EquipmentInstallation | null;
    reason: string;

    constructor(params: LabEquipmentProvisionParams) {
        super(params);
        this.status = params.status;
        this.equipmentId = params.equipmentId;
        this.equipment = params.equipment;
        this.installation = params.installation;
        this.reason = params.reason;
    }

    get isActive() {
        return ![ 'installed', 'cancelled' ].includes(this.status);
    }

    async resolveEquipment(service: EquipmentService): Promise<Equipment> {
        if (!(this.equipment instanceof Equipment)) {
            this.equipment = await firstValueFrom(service.fetch(this.equipmentId));
        }
        return this.equipment;
    }
}

export function labEquipmentProvisionFromJsonObject(json: JsonObject): LabEquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isProvisionStatus(json[ 'status' ])) {
        throw new Error("Expected a provision status 'status'");
    }

    let equipment: Equipment | null;
    let equipmentId: string;
    if (isJsonObject(json[ 'equipment' ])) {
        equipment = equipmentFromJsonObject(json[ 'equipment' ]);
        equipmentId = equipment.id;
    } else if (typeof json[ 'equipment' ] === 'string') {
        equipment = null;
        equipmentId = json[ 'equipment' ];
    } else {
        throw new Error('Expected a json object or string \'equipment\'')
    }

    if (!isJsonObject(json[ 'installation' ]) && json[ 'installation' ] !== null) {
        throw new Error("Expected a json object or null 'install'");
    }
    const installation = json[ 'installation' ] && equipmentInstallationFromJsonObject(json[ 'installation' ])

    if (typeof json[ 'reason' ] !== 'string') {
        throw new Error("Expected a string 'reason'");
    }

    return new LabEquipmentProvision({
        ...baseParams,
        status: json[ 'status' ],
        equipmentId,
        equipment,
        installation: installation,
        reason: json[ 'reason' ]
    });
}

export interface CreateEquipmentProvisionRequest {
    // The status of the newly created request.
    // It is possible for a newly created provision to skip previous steps
    // if conditions are met for them.
    status?: ProvisionStatus;

    // The number of equipments required 
    quantityRequired: number;

    // The reason that the equipment is needed.
    reason: string;

    // The lab to install the equipment into.
    // `null` if it can be installed into any lab.
    lab: Lab | null;

    // The funding source that will provide the project budget, if known
    funding: ResearchFunding | null;

    // The estimated cost of the equipment, if known.
    estimatedCost?: number | null;


    // A url from which the equipment purchase can be arranged.
    purchaseUrl: string;
}

export function createEquipmentProvisionRequestToJson(request: CreateEquipmentProvisionRequest) {
    return {
        status: request.status || 'requested',
        reason: request.reason,

        lab: request.lab?.id || null,
        funding: request.funding?.id || null,

        estimatedCost: request.estimatedCost,
        quantitytRequired: request.quantityRequired,
        purchaseUrl: request.purchaseUrl
    };
}

export interface EquipmentProvisionApprovalRequest {
    // After approval, the lab must be known.
    lab: Lab;

    // After approval, the funding must be known
    funding: ResearchFunding;

    // After approval, the quantity to purchase and install is set.
    quantityApproved: number;
}

export function equipmentProvisionApprovalRequestToJsonObject(request: EquipmentProvisionApprovalRequest) {
    return request;
}

export interface EquipmentProvisionPurchasedRequest {
    readonly provisionStatus: 'purchased';
}

export function equipmentProvisionPurchasedRequestToJsonObject(request: EquipmentProvisionPurchasedRequest) {
    return request;
}

export interface EquipmentProvisionInstalledRequest {
    readonly provisionStatus: 'installed';
    readonly lab: Lab;
    readonly notes: string[];
}

export function equipmentProvisionInstalledRequestToJsonObject(request: EquipmentProvisionInstalledRequest) {
    return request;
}


@Injectable()
export class EquipmentProvisionService extends RelatedModelService<Equipment, LabEquipmentProvision> {
    override readonly context = inject(EquipmentContext);
    override modelFromJsonObject = labEquipmentProvisionFromJsonObject;
    override readonly path = 'provisions';

    create(request: CreateEquipmentProvisionRequest) {
        return this.indexUrl$.pipe(
            first(),
            switchMap(indexUrl => this._httpClient.post<JsonObject>(
                indexUrl,
                createEquipmentProvisionRequestToJson(request)
            )),
            map((response) => this.modelFromJsonObject(response)),
            this._cacheOne
        );
    }

    /**
     * Resets the provision request, overriding it with the newly created request
     * @param provision 
     * @param request 
     */
    reset(provision: LabEquipmentProvision, request: CreateEquipmentProvisionRequest) {
        throw new Error('not implemented');
    }

    approve(provision: LabEquipmentProvision, request: EquipmentProvisionApprovalRequest) {
        return this.resourceUrl(provision.id).pipe(
            switchMap(resourceUrl =>
                this._httpClient.post<JsonObject>(
                    resourceUrl,
                    equipmentProvisionApprovalRequestToJsonObject(request)
                )
            ),
            map(response => this.modelFromJsonObject(response)),
            this._cacheOne
        );
    }

    purchase(provision: LabEquipmentProvision, request: EquipmentProvisionPurchasedRequest) {
        return this.resourceUrl(provision.id).pipe(
            switchMap(resourceUrl => this._httpClient.put<JsonObject>(
                resourceUrl,
                equipmentProvisionPurchasedRequestToJsonObject(request)
            )),
            map(response => this.modelFromJsonObject(response)),
            this._cacheOne
        );
    }

    install(provision: LabEquipmentProvision, request: EquipmentProvisionInstalledRequest) {
        return this.resourceUrl(provision.id).pipe(
            first(),
            switchMap(resourceUrl => this._httpClient.post<JsonObject>(
                resourceUrl,
                equipmentProvisionInstalledRequestToJsonObject(request)
            )),
            map(response => this.modelFromJsonObject(response))
        )
    }
}
