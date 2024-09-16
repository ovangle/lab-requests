import { Component, computed, inject, input } from "@angular/core";
import { SoftwareInstallation } from "./software-installation";
import { SoftwareInfoComponent } from "../software-info.component";
import { LabInstallationInfoComponent } from "src/app/lab/common/installable/lab-installation-info.component";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { SoftwareService } from "../software";
import { CommonModule } from "@angular/common";
import { SoftwareProvisionInfoComponent } from "../provision/software-provision-info.component";


export type SoftwareInstallationInfoDisplay = 'list-item';

@Component({
    selector: 'software-installation-info',
    standalone: true,
    imports: [
        CommonModule,

        SoftwareInfoComponent,
        LabInstallationInfoComponent,

        SoftwareProvisionInfoComponent
    ],
    template: `
    <lab-installation-info
        [installation]="softwareInstallation()"
        [display]="display()" >
        <div class=".installable-title">
            @if (software$ | async; as software) {
                <software-info [software]="software" />
            }
        </div>

        <div class=".installation-details">
            <p>Installed version: <em>{{version()}}</em></p>
        </div>

        <ng-template #provisionDetail let-provision>
            <software-provision-info [provision]="provision" />
        </ng-template>
    </lab-installation-info>
    `
})
export class SoftwareInstallationInfoComponent {
    readonly _softwareService = inject(SoftwareService);

    readonly softwareInstallation = input.required<SoftwareInstallation>();
    readonly display = input<SoftwareInstallationInfoDisplay>('list-item');

    readonly version = computed(() => this.softwareInstallation().installedVersion);

    software$ = toObservable(this.softwareInstallation).pipe(
        switchMap(installation => installation.resolveInstallable(this._softwareService))
    );
}