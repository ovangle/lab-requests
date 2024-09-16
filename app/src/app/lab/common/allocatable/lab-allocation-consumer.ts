import { HttpParams } from "@angular/common/http";
import { inject, Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import { Model, ModelFactory, ModelIndexPage, modelIndexPageFromJsonObject, ModelQuery } from "src/app/common/model/model";
import { ModelService } from "src/app/common/model/model-service";
import { EquipmentLease } from "src/app/equipment/lease/equipment-lease";
import { MaterialAllocation } from "src/app/material/material-allocation";
import { ResearchPlanService } from "src/app/research/plan/research-plan";
import { SoftwareLease } from "src/app/software/lease/software-lease";
import { Discipline } from "src/app/uni/discipline/discipline";
import { isJsonObject, JsonObject } from "src/app/utils/is-json-object";
import { isUUID } from "src/app/utils/is-uuid";
import { LabAllocation } from "./lab-allocation";


export abstract class LabAllocationConsumer extends Model {
    type: string;

    labId: string;

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['type'] !== 'string') {
            throw new Error("Expected a string 'type'");
        }
        this.type = json['type'];

        if (!isUUID(json['labId'])) {
            throw new Error(`Expected a uuid 'labId'`);
        }
        this.labId = json['labId']
    }

    abstract getAllocationPage(allocationType: string): ModelIndexPage<LabAllocation<any>>;
}

@Injectable({ providedIn: 'root' })
export class LabAllocationConsumerService {
    readonly _injector = inject(Injector);

    fetchForTypeId(type: string, id: string): Observable<LabAllocationConsumer> {
        let consumerTypeService: ModelService<any>;
        switch (type) {
            case 'research_plan':
                consumerTypeService = this._injector.get(ResearchPlanService);
                break;
            default:
                throw new Error(`Unrecognised allocation consumer type ${type}`);
        }

        return consumerTypeService.fetch(id);
    }

}