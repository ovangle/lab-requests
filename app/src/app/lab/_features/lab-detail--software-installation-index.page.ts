import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { LabContext } from "../lab-context";
import { SoftwareInstallationService } from "src/app/software/installation/software-installation";
import { map, shareReplay, switchMap } from "rxjs";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";



@Component({
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule
    ],
    template: `
    @if (softwareInstallations$ | async; as softwareInstallations) {
        <mat-list>
            @for (installation of softwareInstallations; track installation.id) {
                <mat-list-item>
                    <a [routerLink]="['/software', installation.softwareId, 'installations', installation.id]">
                        {{installation.softwareName}}
                    </a>

                    <span class="installed-version">{{installation.installedVersion}}</span>
                </mat-list-item>
            }
        </mat-list>
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabDetail__SoftwareInstallationIndex {
    readonly _labContext = inject(LabContext);
    readonly _softwareInstallationService = inject(SoftwareInstallationService);

    readonly lab$ = this._labContext.committed$;

    readonly softwareInstallationPage$ = this.lab$.pipe(
        switchMap(lab => this._softwareInstallationService.queryPage({lab: lab.id})),
        shareReplay(1)
    )

    readonly softwareInstallations$ = this.softwareInstallationPage$.pipe(
        map(page => page.items)
    );

}