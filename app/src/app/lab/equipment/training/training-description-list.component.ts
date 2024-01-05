import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'lab-equipment-training-description-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule],
  template: `
    <mat-list>
      @for (description of trainingDescriptions; track description) {
        <mat-list-item>{{ description }}</mat-list-item>
      } @empty {
        <mat-list-item class="empty-list">
          <mat-icon>warning</mat-icon>
          <i>No training required</i>
        </mat-list-item>
      }
    </mat-list>
  `,
  styles: [
    `
      .empty-list mat-icon {
        width: inherit;
        height: inherit;
        font-size: inherit;
        line-height: inherit;
        vertical-align: bottom;
      }
    `,
  ],
})
export class EquipmentTrainingDescriptionListComponent {
  @Input({ required: true })
  trainingDescriptions: string[];

  @Input()
  itemSuffix?: TemplateRef<{ $implicit: string }>;
}
