import { Provider } from "@angular/core";
import { labWorkUnitModelProviders } from "./work-unit/common/work-unit";
import { labEquipmentModelProviders } from "./equipment/common/equipment";
import { labExperimentalPlanModelProviders } from "./experimental-plan/common/experimental-plan";



export function labModelServiceProviders(): Provider[] {
    return [
        ...labEquipmentModelProviders(),
        ...labExperimentalPlanModelProviders(),
        ...labWorkUnitModelProviders()
    ]
}