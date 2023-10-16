import { Provider } from "@angular/core";
import { FundingModelService, uniFundingModelProviders } from "./research/funding/funding-model";
import { uniCampusModelProviders } from "./campus/common/campus";


export function uniModelServiceProviders(): Provider[] {
    return [
        ...uniCampusModelProviders(),
        ...uniFundingModelProviders()
    ];
}