import { HttpParams } from "@angular/common/http";
import { Injectable, Type, inject } from "@angular/core";
import { ModelQuery } from "src/app/common/model/model";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "src/app/equipment/installation/equipment-installation";
import { LabContext } from "../lab-context";
import { RelatedModelService } from "src/app/common/model/context";
import { Lab } from "../lab";


export interface LabInstallationQuery extends ModelQuery<EquipmentInstallation> {

}

function labInstallationQueryToHttpParams(query: LabInstallationQuery) {
    return new HttpParams();
}


@Injectable()
export class LabEquipmentService extends RelatedModelService<Lab, EquipmentInstallation, LabInstallationQuery> {
    override readonly context = inject(LabContext);
    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
    override readonly modelQueryToHttpParams = labInstallationQueryToHttpParams;
    override readonly path = 'equipments';
}