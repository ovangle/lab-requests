import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

import { EquipmentTag } from './equipment-tag';
import { Equipment } from '../equipment';

@Component({
  selector: 'equipment-tag-chips',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip-listbox>
      <mat-chip-option *ngFor="let tag of equipment!.tags">
        {{ tag }}
      </mat-chip-option>
    </mat-chip-listbox>
  `,
})
export class EquipmentTagChipsComponent {
  @Input({ required: true })
  equipment: Equipment | undefined;
}
