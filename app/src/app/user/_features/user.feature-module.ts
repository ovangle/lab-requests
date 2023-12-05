import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { UserHomePage } from "./user-home.page";
import { CommonModule } from "@angular/common";

const USER_ROUTES: Routes = [
    {
        path: 'home',
        component: UserHomePage
    }
]

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(USER_ROUTES)
    ],
    declarations: [
        UserHomePage
    ]
})
export class UserFeatureModule {

}