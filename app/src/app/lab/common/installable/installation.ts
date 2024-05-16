import { Model, ModelCreateRequest, ModelParams, ModelQuery, ModelUpdateRequest, modelId, modelParamsFromJsonObject } from "src/app/common/model/model";
import { Lab, LabService, labFromJsonObject } from "../../lab";
import { NEVER, Observable, first, firstValueFrom, map, of, race, switchMap, timer } from "rxjs";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { Installable } from "./installable";
import { ModelContext, RelatedModelService } from "src/app/common/model/context";


export interface LabInstallationParams extends ModelParams {
    lab: Lab | string;
}

export function labInstallationParamsFromJsonObject(json: JsonObject): LabInstallationParams {
    const baseParams = modelParamsFromJsonObject(json);

    let lab: Lab | string;
    if (typeof json[ 'lab' ] === 'string') {
        lab = json[ 'lab' ]
    } else if (isJsonObject(json[ 'lab' ])) {
        lab = labFromJsonObject(json[ 'lab' ]);
    } else {
        throw new Error("Expected a string or json object 'lab'");
    }

    return { ...baseParams, lab };
}

/**
 * Represents an item which can be 'installed' into a lab.
 */
export abstract class LabInstallation extends Model implements LabInstallationParams {
    lab: Lab | string;

    abstract readonly installable: Installable<this> | string;

    constructor(params: LabInstallationParams) {
        super(params);

        this.lab = params.lab;
    }

    async resolveLab(service: LabService): Promise<Lab> {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(service.fetch(this.lab));
        }
        return this.lab;
    }
}

export interface LabInstallationQuery<T extends LabInstallation> extends ModelQuery<T> {
    lab?: Lab | string;
    installable?: Installable<T> | string;
}

export function labInstallationQueryToHttpParams(query: LabInstallationQuery<any>, installableParam: string) {
    let params = new HttpParams();
    if (query.lab) {
        params = params.set('lab', modelId(query.lab));
    }
    if (query.installable) {
        params = params.set(installableParam, modelId(query.installable));
    }
    return params;
}

@Injectable()
export abstract class LabInstallationService<
    TInstallation extends LabInstallation,
    TInstallationQuery extends LabInstallationQuery<TInstallation> = LabInstallationQuery<TInstallation>
> extends RestfulService<TInstallation, TInstallationQuery> {
    fetchForInstallableLab(installable: Installable<TInstallation> | string, lab: Lab | string): Observable<TInstallation | null> {
        const labId = modelId(lab);
        const installableId = modelId(installable);
        const fromCache = this.findCache(value =>
            modelId(value.installable) === installableId && modelId(value.lab) === labId
        ).pipe(
            switchMap(value => value != null ? of(value) : NEVER)
        )
        const fromServer = this.queryOne({
            lab,
            installable: installable
        } as Partial<TInstallationQuery>);
        return race(fromCache, fromServer)
    }
}