import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

import { EquipmentTag } from './equipment-tag';
import { Equipment } from '../equipment';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { EquipmentTagInputComponent } from './equipment-tag-input.component';
import { NgControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'equipment-tag-chips',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatChipsModule,
    EquipmentTagInputComponent
  ],
  template: `
    @if (tags().length > 0) {
      <mat-chip-listbox>
        @for (tag of tags(); track tag) {
          <mat-chip-option>
            {{ tag }}
          </mat-chip-option>
        }
      </mat-chip-listbox>
    } @else {
      <p>Equipment has no tags defined</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentTagChipsComponent {

  tags = input.required<string[]>();
  contentEditable = input(false, { transform: coerceBooleanProperty });
}
