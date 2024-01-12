import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

import { EquipmentTag } from './equipment-tag';

@Component({
  selector: 'lab-equipment-tag-chips',
  standalone: true,
  imports: [ CommonModule, MatChipsModule ],
  template: `
    <mat-chip-listbox>
      <mat-chip-option *ngFor="let tag of tags">
        {{ tag }}
      </mat-chip-option>
    </mat-chip-listbox>
  `,
})
export class EquipmentTagChipsComponent {
  @Input()
  tags: string[] = [];
}
