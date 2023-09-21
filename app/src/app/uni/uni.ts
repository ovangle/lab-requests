import { Provider } from "@angular/core";
import { CampusModelService } from "./campus/campus";
import { FundingModelService } from "./research/funding-model/funding-model";


export function uniModelServiceProviders(): Provider[] {
    return [
        CampusModelService,
        FundingModelService
    ];
}