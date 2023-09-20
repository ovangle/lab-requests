import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'lab-equipment-training-description-list--empty',
    standalone: true,
    imports: [
        MatIconModule
    ],
    template: `
    <mat-icon>warning</mat-icon>
    No training required
    `,
    styles: [`
    mat-icon {
        width: inherit;
        height: inherit;
        font-size: inherit;
        line-height: inherit;
        vertical-align: bottom;
    }
    `]
})
export class EquipmentTrainingDescriptionList__Empty {}