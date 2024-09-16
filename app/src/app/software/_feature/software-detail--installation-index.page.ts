import { Component, inject } from "@angular/core";
import { SoftwareContext } from "../software-context";
import { UserContext } from "src/app/user/user-context";
import { combineLatest, switchMap } from "rxjs";
import { SoftwareProvisionService } from "../provision/software-provision";


@Component({
    template: `
    `,
    providers: [
        SoftwareProvisionService
    ]
})
export class SoftwareDetail__InstallationIndex {
    readonly context = inject(SoftwareContext);
    readonly userContext = inject(UserContext);

    readonly software$ = this.context.committed$;
    readonly user$ = this.userContext.committed$;

    readonly _softwareProvisionService = inject(SoftwareProvisionService);

    readonly myProvisions$ = combineLatest([
        this.software$,
        this.user$
    ]).pipe(
        switchMap(([software, user]) => {
            return this._softwareProvisionService.queryPage({
                software: software,
                pendingActionBy: user
            });
        })
    )
}