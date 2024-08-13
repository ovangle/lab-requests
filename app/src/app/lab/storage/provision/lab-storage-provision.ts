import { ModelService } from "src/app/common/model/model-service";
import { LabProvision, LabProvisionCreateRequest, LabProvisionParams, LabProvisionQuery, LabProvisionService, labProvisionCreateRequestToJsonObject, labProvisionParamsFromJsonObject, setLabProvisionQueryParams } from "../../common/provisionable/provision";
import { LabStorage, LabStorageCreateRequest, StorageType, labStorageCreateRequestToJsonObject, labStorageFromJsonObject } from "../lab-storage";
import { Injectable } from "@angular/core";
import { ModelRef, modelId } from "src/app/common/model/model";
import { Equipment } from "src/app/equipment/equipment";
import { NewEquipmentRequest } from "src/app/equipment/provision/equipment-provision";
import { JsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

type LabStorageProvisionType
    = 'store_equipment'
    | 'store_consumable';

function isLabStorageProvisionType(obj: unknown): obj is LabStorageProvisionType {
    return typeof obj === 'string'
        && ['store_equipment', 'store_consumable'].includes(obj);
}

interface LabStorageProvisionParams extends LabProvisionParams<LabStorage> {
    readonly type: LabStorageProvisionType;
}

export class LabStorageProvision extends LabProvision<LabStorage> implements LabStorageProvisionParams {
    override readonly type: LabStorageProvisionType;

    constructor(
        readonly params: LabStorageProvisionParams
    ) {
        super(params);

        this.type = params.type;
    }

    resolveStorage(using: ModelService<LabStorage>) {
        return this.resolveTarget(using);
    }
}

export interface LabStorageProvisionQuery extends LabProvisionQuery<LabStorage, LabStorageProvision> {

}

export function setLabStorageProvisionQueryParams(params: HttpParams, query: Partial<LabStorageProvisionQuery>) {
    params = setLabProvisionQueryParams(params, query);
    return params;
}

export function labStorageProvisionFromJsonObject(json: JsonObject) {
    let baseParams = labProvisionParamsFromJsonObject(
        (value: string) => {
            if (!isLabStorageProvisionType(value)) {
                throw new Error("Expected a lab storage provision type 'type'")
            }
            return value;
        },
        labStorageFromJsonObject,
        json
    );
    return new LabStorageProvision({
        ...baseParams
    });
}

export interface _LabStorageProvisionCreateRequest
    extends LabProvisionCreateRequest<LabStorage, LabStorageProvision> {
    readonly type: LabStorageProvisionType;
    readonly target: ModelRef<LabStorage> | LabStorageCreateRequest;
}

export interface StoreEquipmentRequest extends _LabStorageProvisionCreateRequest {
    readonly type: 'store_equipment';

    equipment: ModelRef<Equipment>;
}

export function storeEquipmentRequestToJsonObject(request: StoreEquipmentRequest) {
    return {
        ...labProvisionCreateRequestToJsonObject(
            labStorageCreateRequestToJsonObject,
            request
        ),
        equipment: modelId(request.equipment)
    };
}

export interface StoreConsumableRequest extends _LabStorageProvisionCreateRequest {
    readonly type: 'store_consumable';
}

export function storeConsumableRequestToJsonObject(request: StoreConsumableRequest) {
    return {
        ...labProvisionCreateRequestToJsonObject(
            labStorageCreateRequestToJsonObject,
            request
        );
    }
}

@Injectable()
export class LabStorageProvisionService extends LabProvisionService<
    LabStorage,
    LabStorageProvision
> {
    override readonly provisionableQueryParam: string = 'storage';
    override readonly path = '/storage';

    override readonly modelFromJsonObject = labStorageProvisionFromJsonObject;

    override create<TRequest extends LabProvisionCreateRequest<LabStorage, LabStorageProvision>>(request: TRequest): Observable<LabStorageProvision> {
        throw new Error("Method not implemented.");
    }
    override setModelQueryParams(params: HttpParams, lookup: Partial<LabProvisionQuery<LabStorage, LabStorageProvision>>): HttpParams {
        throw new Error("Method not implemented.");
    }

}


