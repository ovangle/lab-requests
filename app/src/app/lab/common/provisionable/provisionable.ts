import { map, Observable, switchMap } from "rxjs";
import { Lab, LabService } from "../../lab";
import { Installable } from "../installable/installable";
import { LabInstallation } from "../installable/installation";
import { LabProvision, LabProvisionService } from "./provision";
import { Model, ModelCreateRequest, ModelIndexPage, ModelQuery, ModelRef } from "src/app/common/model/model";
import { Injectable } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { RestfulService } from "src/app/common/model/model-service";
import { JsonObject } from "src/app/utils/is-json-object";
import urlJoin from "url-join";


export interface Provisionable<
    TProvision extends LabProvision<any>
> extends Model {
    labId: string;

    activeProvisions: ModelIndexPage<TProvision>;
}

export interface ProvisionableCreateRequest<
    TProvisionable extends Provisionable<any>,
> extends ModelCreateRequest<TProvisionable> {
    // Include if resubmitting a request
    provisionId?: ModelRef<LabProvision<TProvisionable>>;
    lab?: ModelRef<Lab>;
}

@Injectable()
export abstract class ProvisionableModelService<
    TProvisionable extends Provisionable<any>,
    TQuery extends ModelQuery<TProvisionable>
> extends RestfulService<TProvisionable, TQuery> {
    abstract provisionFromJsonObject(json: JsonObject): LabProvision<TProvisionable>;

    protected createProvision<TProvision extends LabProvision<TProvisionable>>(action: TProvision['action'], provisionable: ModelRef<TProvisionable>, requestJson: JsonObject): Observable<TProvision>;
    protected createProvision<TProvision extends LabProvision<TProvisionable>>(action: TProvision['action'], requestJson: JsonObject): Observable<TProvision>;

    protected createProvision<TProvision extends LabProvision<TProvisionable>>(action: TProvision['action'], arg2: ModelRef<TProvisionable> | JsonObject, arg3?: JsonObject): Observable<TProvision> {
        let submitted: Observable<JsonObject>;
        if (typeof arg3 === undefined) {
            const requestJson = arg2 as JsonObject;

            submitted = this._httpClient.post<JsonObject>(
                urlJoin(this.indexUrl, 'provision', action),
                requestJson
            )
        } else {
            const provisionable = arg2 as ModelRef<TProvisionable>;
            const requestJson = arg3 as JsonObject;

            submitted = this.modelUrl(provisionable).pipe(
                switchMap(modelUrl => this._httpClient.post<JsonObject>(
                    urlJoin(modelUrl, 'provision', action),
                    requestJson
                ))
            );
        }

        return submitted.pipe(
            map(response => this.provisionFromJsonObject(response) as TProvision)
        );
    }


}