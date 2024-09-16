import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
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
        <equipment-training-description-list
          [trainingDescriptions]="trainingDescriptions()" />
      </mat-card-content>
    </mat-card>
  `,
})
export class EquipmentTrainingDescriptionsInfoComponent {
  trainingDescriptions = input.required<string[]>();
}
