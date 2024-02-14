import { Model, ModelIndexPage, ModelParams, ModelPatch, modelParamsFromJsonObject } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Equipment, LabEquipmentCreateRequest, labEquipmentCreateRequestToJson, equipmentFromJsonObject, EquipmentPatch, EquipmentService } from "../equipment";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { Lab } from "../../lab/lab";
import { Observable, first, firstValueFrom, map, shareReplay, switchMap } from "rxjs";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "../installation/equipment-installation";
import { ProvisionStatus, isProvisionStatus } from "../../lab/equipment/provision/provision-status";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ModelService } from "src/app/common/model/model-service";
import urlJoin from "url-join";
import { EquipmentContext } from "../equipment-context";

export interface LabEquipmentProvisionParams extends ModelParams {
    status: ProvisionStatus;
    equipment: Equipment;
    install: EquipmentInstallation | null;
    reason: string;
}

export class LabEquipmentProvision extends Model implements LabEquipmentProvisionParams {
    status: ProvisionStatus;
    equipment: Equipment;
    install: EquipmentInstallation | null;
    reason: string;

    constructor(params: LabEquipmentProvisionParams) {
        super(params);
        this.status = params.status;
        this.equipment = params.equipment;
        this.install = params.install;
        this.reason = params.reason;
    }
}

export function labEquipmentProvisionFromJsonObject(json: JsonObject): LabEquipmentProvision {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isProvisionStatus(json[ 'status' ])) {
        throw new Error("Expected a provision status 'status'");
    }

    if (!isJsonObject(json[ 'equipment' ])) {
        throw new Error("Expected a json object 'equipment'");
    }
    const equipment = equipmentFromJsonObject(json[ 'equipment' ]);

    if (!isJsonObject(json[ 'install' ]) && json[ 'install' ] !== null) {
        throw new Error("Expected a json object or null 'install'");
    }
    const install = json[ 'install' ] && equipmentInstallationFromJsonObject(json[ 'install' ])

    if (typeof json[ 'reason' ] !== 'string') {
        throw new Error("Expected a string 'reason'");
    }

    return new LabEquipmentProvision({
        ...baseParams,
        status: json[ 'status' ],
        equipment,
        install,
        reason: json[ 'reason' ]
    });
}

export interface LabEquipmentProvisionRequest {
    equipment: Equipment | LabEquipmentCreateRequest | string;
    reason: string;
    lab: Lab | string | null;
    funding: ResearchFunding | string | null;
    estimatedCost: number | null;
    quantityRequired: number;
    purchaseUrl: string;
}



export function equipmentProvisionRequestToJson(request: LabEquipmentProvisionRequest) {
    let equipment: JsonObject | string;
    if (request.equipment instanceof Equipment) {
        equipment = request.equipment.id;
    } else if (typeof request.equipment === 'string') {
        equipment = request.equipment;
    } else {
        equipment = labEquipmentCreateRequestToJson(request.equipment);
    }

    let funding: string | null;
    if (request.funding instanceof ResearchFunding) {
        funding = request.funding.id;
    } else {
        funding = request.funding;
    }

    return {
        equipment,
        funding,
        reason: request.reason,
        lab: request.lab,
        estimatedCost: request.estimatedCost,
        quantitytRequired: request.quantityRequired,
        purchaseUrl: request.purchaseUrl
    };
}
export interface LabEquipmentProvisionApprovalRequest {
    // Optionally update the equipment
    equipment?: EquipmentPatch;

    labId?: string;

    // approved for purchase at this cost.
    actualCost: number;
    // From this url. 
    purchaseUrl: string;
}

export function labEquipmentProvisionApprovalRequestToJsonObject(request: LabEquipmentProvisionApprovalRequest) {
    return request;
}

export interface LabEquipmentProvisionInstallRequest {
}

export function labEquipmentProvisionInstallRequestToJsonObject(request: LabEquipmentProvisionInstallRequest) {
    return request;
}


@Injectable()
export class LabEquipmentProvisioningService extends ModelService<LabEquipmentProvision> {

    readonly _equipments = inject(EquipmentService);
    readonly equipmentContext = inject(EquipmentContext);

    override model = LabEquipmentProvision;
    override modelFromJsonObject = labEquipmentProvisionFromJsonObject;

    readonly indexUrl$ = this.equipmentContext.committed$.pipe(
        map(equipment => urlJoin(this._equipments.resourceUrl(equipment.id), 'provisions')),
        shareReplay(1)
    );

    resourceUrl(id: string): Observable<string> {
        return this.indexUrl$.pipe(
            map(indexUrl => urlJoin(indexUrl, id))
        );
    }
    override fetch(id: string): Observable<LabEquipmentProvision> {
        return this.resourceUrl(id).pipe(
            first(),
            switchMap(resourceUrl => this._httpClient.get<JsonObject>(resourceUrl)),
            map(response => this.modelFromJsonObject(response))
        );
    }
    override queryPage(params: HttpParams | { [ k: string ]: string | number | string[]; }): Observable<ModelIndexPage<LabEquipmentProvision>> {
        return this.indexUrl$.pipe(
            first(),
            switchMap(indexUrl => this._httpClient.get<JsonObject>(indexUrl)),
            map(response => this.modelIndexPageFromJsonObject(response))
        );
    }
    override create(request: ModelPatch<LabEquipmentProvision>): Observable<LabEquipmentProvision> {
        throw new Error("Method not implemented.");
    }
    override update(model: string | LabEquipmentProvision, request: ModelPatch<LabEquipmentProvision>): Observable<LabEquipmentProvision> {
        throw new Error("Method not implemented.");
    }
    request(request: LabEquipmentProvisionRequest) {
        return this.indexUrl$.pipe(
            first(),
            switchMap(indexUrl => this._httpClient.post<JsonObject>(
                indexUrl,
                equipmentProvisionRequestToJson(request)
            )),
            map((response) => this.modelFromJsonObject(response))
        );
    }

    approve(provision: LabEquipmentProvision, request: LabEquipmentProvisionApprovalRequest) {
        return this.resourceUrl(provision.id).pipe(
            first(),
            switchMap(resourceUrl =>
                this._httpClient.post<JsonObject>(
                    resourceUrl,
                    labEquipmentProvisionApprovalRequestToJsonObject(request)
                )
            ),
            map(response => this.modelFromJsonObject(response))
        );
    }

    install(provision: LabEquipmentProvision, request: LabEquipmentProvisionInstallRequest) {
        return this.resourceUrl(provision.id).pipe(
            first(),
            switchMap(resourceUrl => this._httpClient.post<JsonObject>(
                resourceUrl,
                labEquipmentProvisionInstallRequestToJsonObject(request)
            )),
            map(response => this.modelFromJsonObject(response))
        )
    }
}
