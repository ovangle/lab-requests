import { Component, computed, inject, input } from "@angular/core";
import { SoftwareInstallationProvision, SoftwareProvisionType } from "./software-provision";
import { LabProvisionInfoComponent } from "src/app/lab/common/provisionable/provision-info.component";
import { SoftwareInstallationService } from "../installation/software-installation";
import { toObservable } from "@angular/core/rxjs-interop";
import { map, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { SoftwareProvisionTypePipe } from "./software-provision-type.pipe";

@Component({
    selector: 'software-provision-info',
    standalone: true,
    imports: [
        CommonModule,

        SoftwareProvisionTypePipe,
        LabProvisionInfoComponent
    ],
    template: `
    <lab-provision-info
        [provision]="provision()"
        hideQuantityInfo
    >
        <div #provisionTypeInfo>
            {{provisionType() | softwareProvisionType}}

        </div>

        <div #provisionTargetInfo>
            <div class="requested-version-info">
                Requested minimum version: <span class="version-info">{{provision().minVersion}}</span>
            </div>

            @if (softwareInstallation$ | async; as installation) {
                <div class="current-version-info">
                    Current: <span class="version-info">{{installation.installedVersion}}</span>
                </div>
            } @else {
                <div class="current-version-info">
                    No current installation
                </div>
            }

            <div class="license-info">
                <div>Requires license: <em>{{provision().requiresLicense ? 'Yes' : 'No'}}</em></div>
                <div>Is paid software: <em>{{provision().isPaidSoftware ? 'Yes' : 'No'}}</em></div>
            </div>
        </div>
    </lab-provision-info>
    `
})
export class SoftwareProvisionInfoComponent {
    _softwareInstallationService = inject(SoftwareInstallationService);
    provision = input.required<SoftwareInstallationProvision>();

    softwareInstallation$ = toObservable(this.provision).pipe(
        switchMap(provision => provision.resolveTarget(this._softwareInstallationService))
    )

    provisionType = computed(() => this.provision().type as SoftwareProvisionType)
}
