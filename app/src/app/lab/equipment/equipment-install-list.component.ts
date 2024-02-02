import { CommonModule } from "@angular/common";
import { Component, Input, SimpleChanges } from "@angular/core";
import { Equipment } from "./equipment";
import { Lab, injectLabService } from "../lab";
import { LabListComponent, LabListItemComponent } from "../lab-list.component";


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
                    @if (_numProvisioned(lab) > 0) {
                        provisioned: {{_numProvisioned(lab)}}
                    }
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
    _installCounts = new Map<string, number>();
    _provisionCounts = new Map<string, number>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes[ 'equipment' ]) {
            for (const installation of this.equipment!.installations) {
                this._installCounts.set(installation.labId, installation.numInstalled);
            }
            for (const provision of this.equipment!.provisions) {
                if (provision.labId) {
                    this._provisionCounts.set(provision.labId, provision.numRequested);
                }
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

    _numInstalled(lab: Lab): number {
        return this._installCounts.get(lab.id) || 0;
    }

    _numProvisioned(lab: Lab): number {
        return this._provisionCounts.get(lab.id) || 0;
    }
}