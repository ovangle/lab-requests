import { Injectable } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { Equipment } from "./equipment";
import { ModelPatch } from "src/app/common/model/model";


@Injectable()
export class EquipmentContext extends ModelContext<Equipment> {
    override _doUpdate(id: string, patch: ModelPatch<Equipment>): Promise<Equipment> {
        throw new Error("Method not implemented.");
    }
}