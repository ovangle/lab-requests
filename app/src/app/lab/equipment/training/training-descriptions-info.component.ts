import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EquipmentTrainingDescriptionListComponent } from './training-description-list.component';

@Component({
  selector: 'lab-equipment-training-descriptions-info',
  standalone: true,
  imports: [
    CommonModule,

    MatCardModule,

    EquipmentTrainingDescriptionListComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <h3>Training required</h3>
      </mat-card-header>
      <mat-card-content>
        <lab-equipment-training-description-list
          [trainingDescriptions]="trainingDescriptions"
        >
        </lab-equipment-training-description-list>
      </mat-card-content>
    </mat-card>
  `,
})
export class EquipmentTrainingDescriptionsInfoComponent {
  @Input({ required: true })
  trainingDescriptions: string[];
}
