import { NgModule, Type } from "@angular/core";
import { RESOURCE_TYPE_NAMES, ResourceType } from "./common/resource";
import { Route, RouterModule, Routes } from "@angular/router";
import { ResourceDetailsPage } from "./common/resource-details.page";

const resourceTypes  = Object.keys(RESOURCE_TYPE_NAMES) as ResourceType[];

export const RESOURCE_ROUTES: Routes = resourceTypes.map(
    (t) => ({
        path: `${t}/:index`,
        component: ResourceDetailsPage,
        data: {resourceType: t}
    })
)
