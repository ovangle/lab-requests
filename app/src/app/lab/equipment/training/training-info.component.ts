import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";


@Component({
    selector: 'lab-equipment-training-info',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    <p>This equipment requires the following competencies:
    <ul>
        <li *ngFor="let description of trainingDescriptions">
            {{description}}
        </li>
    </ul>
    `
})
export class EquipmentTrainingInfoComponent {
    @Input({required: true})
    trainingDescriptions: string[];
}