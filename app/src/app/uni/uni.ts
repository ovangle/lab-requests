import { Provider } from "@angular/core";
import { uniCampusModelProviders } from "./campus/common/campus";


export function uniModelServiceProviders(): Provider[] {
    return [
        ...uniCampusModelProviders(),
    ];
}