import {
  ChangeDetectionStrategy,
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

@Component({
  selector: 'lab-resource-form-title',
  standalone: true,
  imports: [
    CommonModule,
    ResourceTypePipe,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
  <h3 class="title">
    {{ resourceIndex === 'create' ? 'Add' : 'Update' }}
    {{ resourceType! | resourceType:'titleCase' }}
  </h3>

  <div class= "form-controls">
      <button mat-icon-button
              [disabled]="saveDisabled"
              (click)="requestSave.emit()">
        <mat-icon> save </mat-icon>
      </button>

      <button mat-icon-button (click)="requestClose.emit()">
        <mat-icon> cancel </mat-icon>
      </button>
  
  </div>
  `,
  styles: `
    :host {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h3 {
      margin-bottom: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceFormTitleComponent {
  @Input({ required: true })
  resourceType: ResourceType | undefined = undefined;

  @Input()
  resourceIndex: number | 'create' = 'create';

  get isCreate() {
    return this.resourceIndex === 'create';
  }

  @Input()
  saveDisabled: boolean = false;

  @Output()
  requestSave = new EventEmitter<void>();

  @Output()
  requestClose = new EventEmitter<void>();
}
