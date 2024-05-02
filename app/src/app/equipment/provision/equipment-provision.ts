import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, EquipmentCreateRequest, equipmentFromJsonObject, EquipmentService } from "../equipment";
import { ResearchFunding, ResearchFundingService, researchFundingFromJsonObject } from "src/app/research/funding/research-funding";
import { Lab, LabService, labFromJsonObject } from "../../lab/lab";
import { Observable, first, firstValueFrom, map, switchMap } from "rxjs";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "../installation/equipment-installation";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { RelatedModelService } from "src/app/common/model/context";

export interface EquipmentProvisionParams extends ModelParams {
    status: ProvisionStatus;
    equipment: Equipment | string;
    lab: Lab | string | null;
    quantityRequired: number;
    installation: EquipmentInstallation | null;
    reason: string;

    funding: ResearchFunding | string | null;
    estimatedCost: number | null;
}

export class EquipmentProvision extends Model implements EquipmentProvisionParams {
    status: ProvisionStatus;
    equipment: Equipment | string;
    lab: Lab | string | null;
    quantityRequired: number;
    installation: EquipmentInstallation | null;
    reason: string;

    funding: ResearchFunding | string | null;
    estimatedCost: number | null;

    constructor(params: EquipmentProvisionParams) {
        super(params);
        this.status = params.status;
        this.equipment = params.equipment;
        this.lab = params.lab;
        this.quantityRequired = params.quantityRequired;
        this.installation = params.installation;
        this.reason = params.reason;
        this.funding = params.funding;
        this.estimatedCost = params.estimatedCost;
    }

    get isActive() {
        return ![ 'installed', 'cancelled' ].includes(this.status);
    }

    get equipmentId() {
        if (typeof this.equipment === 'string') {
            return this.equipment;
        }
        return this.equipment.id;
    }

    async resolveLab(service: LabService): Promise<Lab | null> {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(service.fetch(this.lab));
        }
        return this.lab;
    }

    async resolveEquipment(service: EquipmentService): Promise<Equipment> {
        if (typeof this.equipment === 'string') {
            this.equipment = await firstValueFrom(service.fetch(this.equipment));
        }
        return this.equipment;
    }

    async resolveFunding(service: ResearchFundingService): Promise<ResearchFunding | null> {
        if (typeof this.funding === 'string') {
            this.funding = await firstValueFrom(service.fetch(this.funding));
        }
        return this.funding;
    }
}


export function equipmentProvisionFromJsonObject(json: JsonObject): EquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isProvisionStatus(json[ 'status' ])) {
        throw new Error("Expected a provision status 'status'");
    }

    let lab: Lab | string | null;
    if (json[ 'lab' ] === null || typeof json[ 'lab' ] === 'string') {
        lab = json[ 'lab' ];
    } else if (isJsonObject(json[ 'lab' ])) {
        lab = labFromJsonObject(json[ 'lab' ])
    } else {
        throw new Error('Expected a json object, string or null \'lab\'')
    }
    let equipment: Equipment | string;
    if (isJsonObject(json[ 'equipment' ])) {
        equipment = equipmentFromJsonObject(json[ 'equipment' ]);
    } else if (typeof json[ 'equipment' ] === 'string') {
        equipment = json[ 'equipment' ];
    } else {
        throw new Error('Expected a json object or string \'equipment\'')
    }

    if (typeof json[ 'quantityRequired' ] !== 'number') {
        throw new Error("Expected a number 'quantityRequired'");
    }

    if (!isJsonObject(json[ 'installation' ]) && json[ 'installation' ] !== null) {
        throw new Error("Expected a json object or null 'install'");
    }
    const installation = json[ 'installation' ] && equipmentInstallationFromJsonObject(json[ 'installation' ])

    if (typeof json[ 'reason' ] !== 'string') {
        throw new Error("Expected a string 'reason'");
    }

    let funding: ResearchFunding | string | null;
    if (isJsonObject(json[ 'funding' ])) {
        funding = researchFundingFromJsonObject(json[ 'funding' ]);
    } else if (json[ 'funding' ] === null || typeof json[ 'funding' ] === 'string') {
        funding = json[ 'funding' ]
    } else {
        throw new Error("Expected a json object, string or null 'funding'")
    }

    if (json[ 'estimatedCost' ] !== null && typeof json[ 'estimatedCost' ] !== 'number') {
        throw new Error("Expected a number or null 'estimatedCost'");
    }

    return new EquipmentProvision({
        ...baseParams,
        status: json[ 'status' ],
        lab,
        equipment,
        quantityRequired: json[ 'quantityRequired' ],
        installation: installation,
        reason: json[ 'reason' ],
        funding,
        estimatedCost: json[ 'estimatedCost' ]
    });
}

export interface EquipmentProvisionQuery extends ModelQuery<EquipmentProvision> {

}
function equipmentProvisionQueryToHttpParams(query: EquipmentProvisionQuery) {
    return new HttpParams();
}


export interface CreateEquipmentProvisionRequest extends ModelCreateRequest<EquipmentProvision> {
    status: 'requested';
    equipment: Equipment;
    lab: Lab;

    // The number of equipments required 
    quantityRequired: number;

    // The reason that the equipment is needed.
    reason: string;
}

export function createEquipmentProvisionRequestToJson(request: CreateEquipmentProvisionRequest) {
    return {
        status: 'requested',
        reason: request.reason,

        lab: request.lab.id,
        quantityRequired: request.quantityRequired,
    };
}

export interface EquipmentProvisionApprovalRequest extends ModelUpdateRequest<EquipmentProvision> {
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

export interface EquipmentProvisionPurchasedRequest extends ModelUpdateRequest<EquipmentProvision> {
    readonly provisionStatus: 'purchased';
}

export function equipmentProvisionPurchasedRequestToJsonObject(request: EquipmentProvisionPurchasedRequest) {
    return request;
}

export interface EquipmentProvisionInstalledRequest extends ModelUpdateRequest<EquipmentProvision> {
    readonly provisionStatus: 'installed';
    readonly lab: Lab;
    readonly notes: string[];
}

export function equipmentProvisionInstalledRequestToJsonObject(request: EquipmentProvisionInstalledRequest) {
    return request;
}

@Injectable()
export abstract class AbstractEquipmentProvisionService<TContext extends Model> extends RelatedModelService<TContext, EquipmentProvision, EquipmentProvisionQuery> {
    override readonly modelFromJsonObject = equipmentProvisionFromJsonObject;
    override readonly modelQueryToHttpParams = equipmentProvisionQueryToHttpParams;

    abstract create(request: CreateEquipmentProvisionRequest): Observable<EquipmentProvision>;
}


@Injectable()
export class EquipmentProvisionService extends AbstractEquipmentProvisionService<Equipment> {
    override readonly context = inject(EquipmentContext);
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
    reset(provision: EquipmentProvision, request: CreateEquipmentProvisionRequest) {
        throw new Error('not implemented');
    }

    approve(provision: EquipmentProvision, request: EquipmentProvisionApprovalRequest) {
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

    purchase(provision: EquipmentProvision, request: EquipmentProvisionPurchasedRequest) {
        return this.resourceUrl(provision.id).pipe(
            switchMap(resourceUrl => this._httpClient.put<JsonObject>(
                resourceUrl,
                equipmentProvisionPurchasedRequestToJsonObject(request)
            )),
            map(response => this.modelFromJsonObject(response)),
            this._cacheOne
        );
    }

    install(provision: EquipmentProvision, request: EquipmentProvisionInstalledRequest) {
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
