import { CommonModule } from "@angular/common";
import { Component, Input, SimpleChanges } from "@angular/core";
import { Equipment } from "./equipment";
import { Lab, injectLabService } from "../lab";
import { LabListComponent, LabListItemComponent } from "../lab-list.component";
import { ProvisionStatus } from "./provision/provision-status";


@Component({
    selector: 'lab-equipment-install-list',
    standalone: true,
    imports: [
        CommonModule,
        LabListComponent,
        LabListItemComponent
    ],
    template: `
    @if (labs$ | async; as labs) {
        <lab-list [labs]="labs"
                  [itemTemplate]="listItem" >
        </lab-list>

        <ng-template #listItem let-lab>
            <lab-list-item [lab]="lab">
                <div class="extra">
                    installed: {{_numInstalled(lab)}}
                    provisioned: {{_numProvisioned(lab)}}
                </div>
            </lab-list-item>
        </ng-template>
    }
    `
})
export class EquipmentInstallListComponent {
    readonly labs = injectLabService();

    @Input({ required: true })
    equipment: Equipment | undefined;
    _provisionInfos = new Map<string, [ ProvisionStatus, number ][]>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes[ 'equipment' ]) {
            for (const installation of this.equipment!.installations) {

                if (!this._provisionInfos.has(installation.labId)) {
                    this._provisionInfos.set(installation.labId, []);
                }
                const provisions = this._provisionInfos.get(installation.labId)!;
                provisions.push([ installation.provisionStatus, installation.numInstalled ]);
            }
        }
    }

    get labs$() {
        const labIds = this.equipment!.installations.map(
            installation => installation.labId
        );
        return this.labs.query({
            ids: labIds
        });
    }

    _provisionInfoForStatus(lab: Lab, status: ProvisionStatus): [ ProvisionStatus, number ] {
        const provisionInfos = this._provisionInfos.get(lab.id)!;
        return provisionInfos.filter(([ s ]) => s === status)[ 0 ] || [ status, 0 ];
    }

    _numInstalled(lab: Lab): number {
        return this._provisionInfoForStatus(lab, 'installed')[ 1 ];
    }

    _numProvisioned(lab: Lab): number {
        const numApproved = this._provisionInfoForStatus(lab, 'approved')[ 1 ]
        const numRequested = this._provisionInfoForStatus(lab, 'requested')[ 1 ];
        return numApproved + numRequested;
    }


}