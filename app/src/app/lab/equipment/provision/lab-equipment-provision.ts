import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, first, map, switchMap } from "rxjs";
import { ModelContext } from "src/app/common/model/context";
import { Equipment } from "src/app/equipment/equipment";
import { AbstractEquipmentProvisionService, CreateEquipmentProvisionRequest, EquipmentProvision, EquipmentProvisionQuery, createEquipmentProvisionRequestToJson } from "src/app/equipment/provision/equipment-provision";
import { JsonObject } from "src/app/utils/is-json-object";
import { LabContext } from "../../lab-context";
import { Lab } from "../../lab";


@Injectable()
export class LabEquipmentProvisionService extends AbstractEquipmentProvisionService<Lab> {
    override readonly context = inject(LabContext);
    override path = 'equipments';
    override create(request: CreateEquipmentProvisionRequest): Observable<EquipmentProvision> {
        return this.indexUrl$.pipe(
            first(),
            switchMap(indexUrl => this._httpClient.post<JsonObject>(
                indexUrl,
                createEquipmentProvisionRequestToJson(request)
            )),
            map(response => this.modelFromJsonObject(response)),
            this._cacheOne
        )
    }


}