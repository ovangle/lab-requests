import { HttpParams } from "@angular/common/http";
import { Injectable, Type, inject } from "@angular/core";
import { Observable, first, map, shareReplay, switchMap } from "rxjs";
import { ModelIndexPage, ModelPatch } from "src/app/common/model/model";
import { ModelService } from "src/app/common/model/model-service";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "src/app/equipment/installation/equipment-installation";
import { JsonObject } from "src/app/utils/is-json-object";
import { LabContext } from "../lab-context";
import urlJoin from "url-join";
import { RelatedModelService } from "src/app/common/model/context";
import { Lab } from "../lab";


@Injectable()
export class LabEquipmentService extends RelatedModelService<Lab, EquipmentInstallation> {
    override readonly context = inject(LabContext);
    override readonly modelFromJsonObject = equipmentInstallationFromJsonObject;
}