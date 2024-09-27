import { Component, computed, inject, input } from "@angular/core";
import { NewSoftwareProvision, SoftwareInstallationProvision, SoftwareProvisionType, UpgradeSoftwareProvision } from "./software-provision";
import { LabProvisionInfoComponent } from "src/app/lab/common/provisionable/provision-info.component";
import { SoftwareInstallationService } from "../installation/software-installation";
import { toObservable } from "@angular/core/rxjs-interop";
import { map, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { SoftwareProvisionTypePipe } from "./software-provision-type.pipe";

@Component({
    selector: 'software-provision-info--new-software',
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
export class SoftwareProvisionInfo__NewSoftwareProvision {
    _softwareInstallationService = inject(SoftwareInstallationService);
    provision = input.required<NewSoftwareProvision>();

    softwareInstallation$ = toObservable(this.provision).pipe(
        switchMap(provision => this._softwareInstallationService.fetch(provision.installationId))
    )
}

@Component({
    selector: 'software-provision-info--upgrade-software-provision',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``
})
export class SoftwareProvisionInfo__UpgradeSoftwareProvision {
    provision = input.required<UpgradeSoftwareProvision>();
}

@Component({
    selector: 'software-provision-info',
    standalone: true,
    imports: [
        SoftwareProvisionInfo__NewSoftwareProvision,
        SoftwareProvisionInfo__UpgradeSoftwareProvision
    ],
    template: `
    @switch (provisionAction()) {
        @case ('new_software') {
            <software-provision-info--new-software [provision]="_newSoftwareProvision()" />
        }
        @case ('upgrade_software') {
            <software-provision-info--upgrade-software-provision [provision]="_upgradeSoftwareProvision()" />
        }
    }
    `
})
export class SoftwareProvisionInfoComponent {
    provision = input.required<SoftwareInstallationProvision>();

    provisionAction = computed(() => this.provision().action);
    _newSoftwareProvision = computed(() => this.provision() as NewSoftwareProvision);
    _upgradeSoftwareProvision = computed(() => this.provision() as UpgradeSoftwareProvision);


}