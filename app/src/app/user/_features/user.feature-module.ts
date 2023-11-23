import { NgModule } from "@angular/core";
import { UserLoginPage } from "./user-login.page";
import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { UserLoginFormComponent } from "../common/login/login-form.component";

const USER_ROUTES: Routes = [
    {
        path: 'login',
        component: UserLoginPage
    }
]

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(USER_ROUTES),

        UserLoginFormComponent
    ],
    declarations: [
        UserLoginPage
    ]
})
export class UserFeatureModule {}