import { RouterModule, Routes } from "@angular/router";
import { CampusCreatePage } from "./campus-create.page";
import { NgModule } from "@angular/core";
import { CampusModelService } from "./campus";

const campusRoutes: Routes = [
    {
        path: 'create',
        component: CampusCreatePage
    }
]

@NgModule({
    imports: [
        RouterModule.forChild(campusRoutes)
    ],
    exports: [
        RouterModule
    ],
    providers: [
        CampusModelService
    ]
})
export class CampusFeature {}