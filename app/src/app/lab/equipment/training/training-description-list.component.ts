import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { EquipmentTrainingDescriptionList__Empty } from "./training-description-list--empty.component";



@Component({
    selector: 'lab-equipment-training-description-list',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatListModule,

        EquipmentTrainingDescriptionList__Empty
    ],
    template: `
    <mat-list> 
        <ng-container *ngIf="trainingDescriptions.length > 0; else noTrainingRequired">
            <mat-list-item *ngFor="let description of trainingDescriptions">
                {{description}}
            </mat-list-item>
        </ng-container>

        <ng-template #noTrainingRequired>
            <mat-list-item>
                <lab-equipment-training-description-list--empty>
                </lab-equipment-training-description-list--empty>
            </mat-list-item>
        </ng-template>
    </mat-list>
    `,
    styles: [`
    
    `]
})
export class EquipmentTrainingDescriptionListComponent {
    @Input({required: true})
    trainingDescriptions: string[];

    @Input()
    itemSuffix?: TemplateRef<{$implicit: string}>;
}