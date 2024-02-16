import { Injectable, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { Equipment, EquipmentService } from "./equipment";
import { ModelPatch } from "src/app/common/model/model";


@Injectable()
export class EquipmentContext extends ModelContext<Equipment> {
    override readonly service = inject(EquipmentService);
}