import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { ResourceType } from '../resource-type';
import { ResourceTypePipe } from '../resource-type.pipe';
import { WorkUnitFormTitleComponent } from '../../work-unit/common/work-unit-form-title.component';

@Component({
  selector: 'lab-resource-form-title',
  standalone: true,
  imports: [CommonModule, ResourceTypePipe, WorkUnitFormTitleComponent],
  template: `
    <lab-work-unit-form-title
      [workUnitName]="containerName"
      subtitle="{{ isCreate ? 'Add' : 'Update' }} {{ resourceType }}"
      [saveDisabled]="saveDisabled"
      (requestSave)="requestSave.emit($event)"
      (requestClose)="requestClose.emit($event)"
    >
      {{ resourceIndex === 'create' ? 'Add' : 'Update' }}
      {{ resourceType | resourceType }}
    </lab-work-unit-form-title>
  `,
  styles: [
    `
      lab-work-unit-form-title {
        width: 100%;
      }
    `,
  ],
})
export class ResourceFormTitleComponent {
  @Input({ required: true })
  containerName: string;

  @Input({ required: true })
  resourceType: ResourceType;

  @Input()
  resourceIndex: number | 'create';

  get isCreate() {
    return this.resourceIndex === 'create';
  }

  @Input()
  saveDisabled: boolean;

  @Output()
  requestSave = new EventEmitter<void>();

  @Output()
  requestClose = new EventEmitter<void>();
}
