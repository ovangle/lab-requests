import { Injectable, NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { UserHomePage } from "./user-home.page";
import { CommonModule } from "@angular/common";
import { AlterPasswordPage } from "./alter-password.page";
import { AlterPasswordFormComponent } from "../common/alter-password-form.component";

const USER_ROUTES: Routes = [
    {
        path: 'home',
        component: UserHomePage
    },
    {
        path: 'alter-password',
        component: AlterPasswordPage
    },
    {
        path: 'login',
        redirectTo: '/oauth/login'
    },
    {
        path: 'logout',
        redirectTo: '/oauth/logout'
    }
]

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(USER_ROUTES),

        AlterPasswordFormComponent
    ],
    declarations: [
        UserHomePage,
        AlterPasswordPage
    ] 
})
export class UserFeatureModule {

}