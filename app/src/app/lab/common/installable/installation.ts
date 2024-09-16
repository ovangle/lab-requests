import { Model, ModelCreateRequest, ModelFactory, ModelIndexPage, ModelQuery, ModelRef, ModelUpdateRequest, modelId, modelIndexPageFromJsonObject, modelRefFromJson, resolveRef, setModelQueryParams } from "src/app/common/model/model";
import { Lab, LabService } from "../../lab";
import { NEVER, Observable, first, firstValueFrom, map, of, race, switchMap, timer } from "rxjs";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { Installable } from "./installable";
import { ModelContext, RelatedModelService } from "src/app/common/model/context";
import { Provisionable } from "../provisionable/provisionable";
import { LabProvision } from "../provisionable/provision";
import { isUUID } from "src/app/utils/is-uuid";
import { Allocatable, LabAllocation } from "../allocatable/lab-allocation";

/**
 * Represents an item which can be 'installed' into a lab.
 */
export abstract class LabInstallation<
    TInstallable extends Installable<any>,
    TProvision extends LabProvision<any> = LabProvision<any>,
    TAllocation extends LabAllocation<any> = LabAllocation<any>
> extends Model implements Provisionable<TProvision>, Allocatable<TAllocation> {
    readonly type: string;
    readonly labId: string;

    readonly provisionType: string;
    readonly activeProvisions: ModelIndexPage<TProvision>;

    readonly allocationType: string;
    readonly activeAllocations: ModelIndexPage<TAllocation>;

    abstract readonly installableId: string;

    constructor(provisionModel: ModelFactory<TProvision>, allocationModel: ModelFactory<TAllocation>, json: JsonObject) {
        super(json);

        if (typeof json['type'] !== 'string') {
            throw new Error("Expected a string 'type'")
        }
        this.type = json['type'];

        if (!isUUID(json['labId'])) {
            throw new Error("Expected a string 'labId'")
        }
        this.labId = json['labId'];

        if (typeof json['provisionType'] !== 'string') {
            throw new Error(`Expected a string 'provisionType'`);
        }
        this.provisionType = json['provisionType'];
        if (!isJsonObject(json['activeProvisions'])) {
            throw new Error(`Expected a json object 'currentProvisions'`);
        }
        this.activeProvisions = modelIndexPageFromJsonObject(
            provisionModel,
            json['activeProvisions']
        );

        if (typeof json['allocationType'] !== 'string') {
            throw new Error(`Expected a string 'allocationType'`);
        }
        this.allocationType = json['allocationType'];

        if (!isJsonObject(json['activeAllocations'])) {
            throw new Error(`Expected a json object 'activeAllocations'`);
        }
        this.activeAllocations = modelIndexPageFromJsonObject(
            allocationModel,
            json['activeAllocations']
        );
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
            value => value.installableId === installableId && value.labId === labId
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