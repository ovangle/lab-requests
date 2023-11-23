import { ModuleWithProviders, NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthRedirectPageComponent } from "./oauth-redirect.page";

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '/redirect',
                component: AuthRedirectPageComponent
            }
        ])
    ],
})
export class OauthModule {
    static forRoot(authModuleRoute: string): ModuleWithProviders<OauthModule> {
        return {
            ngModule: OauthModule,
            providers: [
                provideAuthRedirectUrl()
            ]
        }

    }
}
