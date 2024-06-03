import { Component, inject } from "@angular/core";
import { SoftwareContext } from "../software-context";
import { SoftwareInstallationIndex } from "../installation/software-installation-index";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from "@angular/router";
import { AsyncPipe } from "@angular/common";
import { SoftwareInstallation } from "../installation/software-installation";
import { SoftwareInstallationInfoComponent } from "../installation/software-installation-info.component";


@Component({
    standalone: true,
    imports: [
        AsyncPipe,

        RouterModule,
        MatListModule,

        SoftwareInstallationInfoComponent
    ],
    template: `
    @if (index.pageItems$ | async; as pageItems) {
    <mat-list>
        @for (item of pageItems; track item.id) {
            <mat-list-item>
                <software-installation-info
                    [softwareInstallation]="item"
                    display="list-item" />
            </mat-list-item>
        }
    </mat-list>
    }
    `,
    providers: [
        SoftwareInstallationIndex
    ]
})
export class SoftwareDetail__InstallationsPage {
    readonly softwareContext = inject(SoftwareContext);

    readonly index = inject(SoftwareInstallationIndex);

}