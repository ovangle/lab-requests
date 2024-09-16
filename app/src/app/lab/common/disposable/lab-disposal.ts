import { HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Model, ModelFactory, modelId, ModelQuery, ModelRef, setModelQueryParams } from "src/app/common/model/model";
import { RestfulService } from "src/app/common/model/model-service";
import { isJsonObject, JsonObject } from "src/app/utils/is-json-object";
import { isUUID } from "src/app/utils/is-uuid";
import { LabStorageStrategy } from "../storable/lab-storage";
import { Lab } from "../../lab";
import { Observable } from "rxjs";

export class LabDisposalStrategy extends Model {
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
export class LabDisposalStrategyService extends RestfulService<LabDisposalStrategy> {
    override readonly path = '/lab/disposal-strategy';
    override readonly model = LabDisposalStrategy;
    override setModelQueryParams(params: HttpParams, lookup: Partial<ModelQuery<LabDisposalStrategy>>): HttpParams {
        return params;
    }
}

export class LabDisposal extends Model {
    strategy: LabDisposalStrategy;
    labId: string;

    constructor(json: JsonObject) {
        super(json);

        if (!isJsonObject(json['strategy'])) {
            throw new Error(`Expected a json object 'strategy'`);
        }
        this.strategy = new LabDisposalStrategy(json['strategy']);

        if (!isUUID(json['labId'])) {
            throw new Error(`Expected a uuid 'labId'`);
        }
        this.labId = json['labId'];
    }

}

export interface LabDisposalQuery extends ModelQuery<LabDisposal> {
    lab: ModelRef<Lab>;
    strategy: ModelRef<LabDisposalStrategy>;
}

@Injectable({providedIn: 'root'})
export class LabDisposalService extends RestfulService<LabDisposal> {
    override readonly path = '/lab/disposal'
    override readonly model = LabDisposal;

    readonly _disposalStrategyService = inject(LabDisposalStrategyService);

    override setModelQueryParams(params: HttpParams, query: LabDisposalQuery) {
        params = setModelQueryParams(params, query);
        if (query.lab) {
            params = params.set('lab', modelId(query.lab));
        }
        if (query.strategy) {
            params = params.set('strategy', modelId(query.strategy));
        }
        return params;
    }

    allStrategies(): Observable<readonly LabStorageStrategy[]> {
        return this._disposalStrategyService.query({});
    }



}