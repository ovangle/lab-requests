import { Model, ModelCreateRequest, ModelIndexPage, ModelQuery, ModelRef, modelId, modelIndexPageFromJsonObject, modelRefFromJson, setModelQueryParams } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Lab } from "../../lab";
import { RestfulService } from "src/app/common/model/model-service";
import { isUUID } from "src/app/utils/is-uuid";
import { inject, Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

export class LabStorageStrategy extends Model {
    name: string;
    description: string;

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['name'] !== 'string') {
            throw new Error(`Expected a string 'name'`);
        }
        this.name = json['name'];
        if (typeof json['description'] !== 'string') {
            throw new Error(`Expected a string 'description'`);
        }
        this.description = json['description'];
    }
}

@Injectable({providedIn: 'root'})
export class LabStorageStrategyService extends RestfulService<LabStorageStrategy> {
    override readonly path = '/lab/storage-strategy';
    override readonly model = LabStorageStrategy;

    override setModelQueryParams(params: HttpParams, lookup: Partial<ModelQuery<LabStorageStrategy>>): HttpParams {
        return params;
    }
}

export class LabStorageContainer extends Model {
    storageId: string;

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['storageId'])) {
            throw new Error(`Expected a uuid 'storageId'`);
        }
        this.storageId = json['storageId'];
    }
}

export class LabStorage extends Model {
    labId: string;
    strategy: LabStorageStrategy;

    containers: ModelIndexPage<LabStorageContainer>;

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['labId'])) {
            throw new Error(`Expected a uuid 'labId'`);
        }
        this.labId = json['labId'];

        if (!isJsonObject(json['strategy'])) {
            throw new Error(`Expected a json object 'strategy'`)
        }
        this.strategy = new LabStorageStrategy(json['strategy']);

        if (!isJsonObject(json['containers'])) {
            throw new Error(`Expected a json object 'containers'`)
        }
        this.containers = modelIndexPageFromJsonObject(LabStorageContainer, json['containers']);
    }
}

export interface LabStorageQuery extends ModelQuery<LabStorage> {
    lab: ModelRef<Lab>;
    strategy: ModelRef<LabStorageStrategy>;
}

export interface LabStorageCreateRequest extends ModelCreateRequest<LabStorage> {
    lab: ModelRef<Lab>;
    strategyId: string;
}

export function labStorageCreateRequestToJsonObject(request: LabStorageCreateRequest): JsonObject {
    return {
        lab: modelId(request.lab),
        strategyId: request.strategyId,
    };
}

@Injectable({providedIn: 'root'})
export class LabStorageService extends RestfulService<LabStorage, LabStorageQuery> {

    override readonly path = '/lab/storage';
    override readonly model = LabStorage;

    readonly _storageStrategyService = inject(LabStorageStrategyService);

    allStrategies(): Promise<ReadonlyArray<LabStorageStrategy>> {
        return firstValueFrom(this._storageStrategyService.query({}));
    }

    override setModelQueryParams(params: HttpParams, query: Partial<LabStorageQuery>): HttpParams {
        params = setModelQueryParams(params, query);

        if (query.lab) {
            params = params.set('lab', modelId(query.lab));
        }
        if (query.strategy) {
            params = params.set('strategy', modelId(query.strategy));
        }

        return params;
    }
}
