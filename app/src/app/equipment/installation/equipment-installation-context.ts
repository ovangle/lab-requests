import { Injectable } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { EquipmentInstallation, EquipmentInstallationService } from "./equipment-installation";
import { EquipmentTransferRequest, NewEquipmentProvision, NewEquipmentRequest } from "../provision/equipment-provision";
import { firstValueFrom } from "rxjs";


@Injectable()
export class EquipmentInstallationContext extends ModelContext<EquipmentInstallation, EquipmentInstallationService> {

    async newEquipment(request: NewEquipmentRequest): Promise<NewEquipmentProvision> {
        const maybeInstall = await firstValueFrom(this.mCommitted$);

        let provision: NewEquipmentProvision;
        if (maybeInstall == null) {
            provision = await firstValueFrom(this.service.newEquipment(request));
        } else {
            provision = await firstValueFrom(this.service.newEquipment(maybeInstall, request));
        }

        await this.refresh();
        return provision;
    }

    async transferEquipment(request: EquipmentTransferRequest) {
        let installation = await firstValueFrom(this.committed$);
        let provision = await firstValueFrom(this.service.transferEquipment(installation, request));
        await this.refresh();
        return provision;
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