import { Injectable } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { EquipmentInstallation, EquipmentInstallationService } from "./equipment-installation";
import { EquipmentTransferRequest } from "../provision/equipment-provision";
import { firstValueFrom } from "rxjs";


@Injectable()
export class EquipmentInstallationContext extends ModelContext<EquipmentInstallation, EquipmentInstallationService> {

    async transferEquipment(request: EquipmentTransferRequest) {
        let installation = await firstValueFrom(this.committed$);
        const provision = await firstValueFrom(this.service.transferEquipment(request));

        this.nextCommitted(installation);
    }
}


export function provideEquipmentInstallationContext(options = { isOptionalParam: false }) {
    return provideModelContextFromRoute(
        EquipmentInstallationService,
        EquipmentInstallationContext,
        'equipment_installation',
        options.isOptionalParam
    );
}