import { Component, Input } from "@angular/core";
import { ResourceStorage } from "./resource-storage";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'lab-resource-storage',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    <div>
        <h4>Storage</h4>

        <ng-container *ngIf="storage; else notStored">
            <div class="storage-type">
                Type: {{storage.type}}
            </div>
        </ng-container>

        <ng-template #notStored>
            No storage required
        </ng-template>
    </div>
    `
})
export class ResourceStorageDetailsComponent {
    @Input()
    storage: ResourceStorage | null;
}