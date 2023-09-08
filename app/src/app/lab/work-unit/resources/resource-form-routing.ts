import { Type } from "@angular/core";
import { ResourceType } from "./common/resource";
import { Route } from "@angular/router";


export function resourceFormRoutes(resourceType: ResourceType, formComponent: Type<any>): Route[] {
    return [
        {
            path: `${resourceType}/:index`,
            outlet: 'form',
            component: formComponent
        }
    ]
}
