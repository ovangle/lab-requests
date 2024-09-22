import { Injectable, Provider, inject } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { Equipment, EquipmentService } from "./equipment";
import { map } from "rxjs";


@Injectable()
export class EquipmentContext extends ModelContext<Equipment, EquipmentService> { }

export function provideEquipmentContextFromRoute(options = { isOptionalParam: false }): Provider {
    return provideModelContextFromRoute(
        EquipmentService,
        EquipmentContext,
        'equipment',
        options.isOptionalParam
    );
}