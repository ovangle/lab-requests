import { HttpParams } from "@angular/common/http";
import { Injectable, Type, inject } from "@angular/core";
import { Observable, first, map, shareReplay, switchMap } from "rxjs";
import { ModelIndexPage, ModelPatch } from "src/app/common/model/model";
import { ModelService } from "src/app/common/model/model-service";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "src/app/equipment/installation/equipment-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { LabContext } from "../lab-context";
import { injectLabService } from "../lab";
import urlJoin from "url-join";


@Injectable()
export class LabEquipmentService extends ModelService<EquipmentInstallation> {
    override model = EquipmentInstallation;
    readonly _labs = injectLabService();
    readonly labContext = inject(LabContext);

    readonly indexUrl$ = this.labContext.committed$.pipe(
        map(lab => urlJoin(this._labs.resourceUrl(lab.id), 'equipments')),
        shareReplay(1)
    );

    resourceUrl(id: string) {
        return this.indexUrl$.pipe(
            map(indexUrl => urlJoin(indexUrl, id))
        )
    }

    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
    override fetch(id: string): Observable<EquipmentInstallation> {
        return this.resourceUrl(id).pipe(
            first(),
            switchMap(resourceUrl => this._httpClient.get<JsonObject>(resourceUrl)),
            map(response => this.modelFromJsonObject(response))
        );
    }
    override queryPage(params: HttpParams | { [ k: string ]: string | number | string[]; }): Observable<ModelIndexPage<EquipmentInstallation>> {
        return this.indexUrl$.pipe(
            first(),
            switchMap(indexUrl => this._httpClient.get<JsonObject>(indexUrl)),
            map(response => this.modelIndexPageFromJsonObject(response))
        );
    }
    override create(request: ModelPatch<EquipmentInstallation>): Observable<EquipmentInstallation> {
        throw new Error("Method not implemented.");
    }
    override update(model: string | EquipmentInstallation, request: ModelPatch<EquipmentInstallation>): Observable<EquipmentInstallation> {
        throw new Error("Method not implemented.");
    }
}