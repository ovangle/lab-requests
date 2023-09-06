import { Type } from "@angular/core";
import { ResourceType } from "./common/resource";
import { Route } from "@angular/router";


export function resourceFormRoutes(resourceType: ResourceType, formComponent: Type<any>): Route[] {
    return [
        {
            path: `${resourceType}/create`,
            outlet: 'form',
            component: formComponent
        },
        {
            path: `${resourceType}/update/:index`,
            outlet: 'form',
            component: formComponent
        }
    ]
}
