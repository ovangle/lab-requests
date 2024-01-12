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
import { WorkUnit, formatWorkUnit } from './work-unit';
import { formatCampus } from 'src/app/uni/campus/common/campus';

@Component({
  selector: 'lab-work-unit-form-title',
  standalone: true,
  imports: [ CommonModule, MatButtonModule, MatIconModule ],
  template: `
    <h2>
      Update {{ workUnitName }} <br />
      @if (subtitle) {
        <small class="subtitle">{{ subtitle }}</small>
      }
    </h2>

    <div class="form-controls">
      <button
        mat-icon-button
        [disabled]="saveDisabled"
        (click)="requestSave.emit()"
      >
        <mat-icon>save</mat-icon>
      </button>

      <button mat-icon-button (click)="requestClose.emit()">
        <mat-icon>cancel</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      h2 {
        margin-bottom: 0;
      }
    `,
  ],
})
export class WorkUnitFormTitleComponent {
  @Input({ required: true })
  workUnitName: string | undefined;

  @Input()
  subtitle: string | undefined;

  @Input()
  saveDisabled: boolean = false;

  @Output()
  requestSave = new EventEmitter<void>();

  @Output()
  requestClose = new EventEmitter<void>();
}

function formatDiscipline(discipline: any) {
  throw new Error('Function not implemented.');
}
