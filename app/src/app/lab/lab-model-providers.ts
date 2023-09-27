import { Provider } from "@angular/core";
import { labEquipmentModelServiceProviders } from "./equipment/equipment";
import { labExperimentalPlanModelServiceProviders } from "./experimental-plan/experimental-plan";
import { labWorkUnitModelServiceProviders } from "./work-unit/work-unit";



export function labModelServiceProviders(): Provider[] {
    return [
        ...labEquipmentModelServiceProviders(),
        ...labExperimentalPlanModelServiceProviders(),
        ...labWorkUnitModelServiceProviders()
    ]
}