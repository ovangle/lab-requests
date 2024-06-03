import { Model, ModelCreateRequest, ModelIndexPage, ModelParams, ModelQuery, ModelUpdateRequest, modelId, modelParamsFromJsonObject, resolveModelRef, resolveRef, setModelQueryParams } from "src/app/common/model/model";
import { Lab, LabService, labFromJsonObject } from "../../lab";
import { NEVER, Observable, first, firstValueFrom, map, of, race, switchMap, timer } from "rxjs";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { Installable } from "./installable";
import { ModelContext, RelatedModelService } from "src/app/common/model/context";
import { Provisionable } from "../provisionable/provisionable";
import { LabProvision, labProvisionParamsFromJsonObject } from "../provisionable/provision";


export interface LabInstallationParams<TInstallable extends Installable<any>, TProvision extends LabProvision<any>> extends ModelParams {
    lab: Lab | string;
    installable: TInstallable | string;

    currentProvisions: readonly TProvision[];
}

export function labInstallationParamsFromJsonObject<TInstallable extends Installable<any>, TProvision extends LabProvision<any>>(
    installableFromJsonObject: (json: JsonObject) => TInstallable,
    provisionFromJsonObject: (json: JsonObject) => TProvision,
    installableKey: string,
    json: JsonObject
): LabInstallationParams<TInstallable, TProvision> {
    const baseParams = modelParamsFromJsonObject(json);

    let lab: Lab | string;
    if (typeof json['lab'] === 'string') {
        lab = json['lab']
    } else if (isJsonObject(json['lab'])) {
        lab = labFromJsonObject(json['lab']);
    } else {
        throw new Error("Expected a string or json object 'lab'");
    }

    let installable: TInstallable | string;
    const jsonInstallable = json[installableKey];
    if (typeof jsonInstallable === 'string') {
        installable = jsonInstallable;
    } else if (isJsonObject(jsonInstallable)) {
        installable = installableFromJsonObject(jsonInstallable);
    } else {
        throw new Error(`Expected a string or json object '${installableKey}'`)
    }

    if (!Array.isArray(json['currentProvisions'])) {
        throw new Error(`Expected an array 'currentProvisions'`);
    }
    const currentProvisions = json['currentProvisions'].map((item) => {
        if (!isJsonObject(item)) {
            throw new Error('currentProvisions must be an array of json objects');
        }
        return provisionFromJsonObject(item);
    });

    return { ...baseParams, lab, installable, currentProvisions };
}

/**
 * Represents an item which can be 'installed' into a lab.
 */
export abstract class LabInstallation<
    TInstallable extends Installable<any>,
    TProvision extends LabProvision<any>
> extends Model implements Provisionable<TProvision> {
    lab: Lab | string;
    installable: TInstallable | string;
    currentProvisions: readonly any[];

    constructor(params: LabInstallationParams<TInstallable, TProvision>) {
        super(params);

        this.lab = params.lab;
        this.installable = params.installable;
        this.currentProvisions = params.currentProvisions;
    }

    resolveLab(service: LabService): Promise<Lab> {
        return firstValueFrom(resolveRef(this.lab, service));
    }

    resolveInstallable(service: ModelService<TInstallable & Model>): Promise<TInstallable> {
        return resolveModelRef(this, 'installable', service as any);
    }

}

export interface LabInstallationQuery<TInstallable extends Installable<any>, T extends LabInstallation<TInstallable, any>> extends ModelQuery<T> {
    lab?: Lab | string;
    installable?: TInstallable | string;
}

export function setLabInstallationQueryParams(params: HttpParams, query: Partial<LabInstallationQuery<any, any>>, installableParam: string) {
    params = setModelQueryParams(params, query);
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
    TInstallable extends Installable<TInstallation>,
    TInstallation extends LabInstallation<TInstallable, any>,
    TInstallationQuery extends LabInstallationQuery<TInstallable, TInstallation> = LabInstallationQuery<TInstallable, TInstallation>
> extends RelatedModelService<TInstallable, TInstallation, TInstallationQuery> {
    labService = inject(LabService);

    fetchForInstallableLab(installable: TInstallable | string, lab: Lab | string): Observable<TInstallation | null> {
        const labId = modelId(lab);
        const installableId = modelId(installable);

        const fromCache = this.findCache(
            value => modelId(value.installable) === installableId && modelId(value.lab) === labId
        ).pipe(
            switchMap(value => value != null ? of(value) : NEVER)
        );

        const fromServer = this.queryOne({
            lab,
            installable: installable
        } as Partial<TInstallationQuery>);
        return race(fromCache, fromServer)
    }
}