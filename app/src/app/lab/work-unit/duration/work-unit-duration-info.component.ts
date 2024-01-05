import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateRange, MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { WorkUnit } from '../common/work-unit';

@Component({
  selector: 'lab-work-unit-duration-info',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <button mat-flat-button (click)="_calendarVisible = !_calendarVisible">
          <mat-icon>calendar_today</mat-icon>
          Duration {{ dateRangeText }}
        </button>
      </mat-card-header>
      <mat-card-content
        [@calendarExpand]="calendarVisible ? 'expanded' : 'collapsed'"
      >
        <mat-calendar [selected]="dateRange" />
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      :host {
        --mat-datepicker-calendar-date-hover-state-background-color: #2e7fb500;
      }

      mat-calendar {
        width: 250px;
      }

      .mat-mdc-card-content {
        overflow: hidden;
      }
    `,
  ],
  animations: [
    trigger('calendarExpand', [
      state('collapsed', style({ height: '0px', minHeight: 0 })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
})
export class WorkUnitDurationInfoComponent {
  @Input({ required: true })
  workUnit: WorkUnit;

  @Input()
  get calendarVisible(): boolean {
    return this._calendarVisible;
  }
  set calendarVisible(value: BooleanInput) {
    this._calendarVisible = coerceBooleanProperty(value);
  }
  _calendarVisible: boolean = false;

  get startDate(): Date | null {
    return this.workUnit.startDate;
  }

  get endDate(): Date | null {
    return this.workUnit.endDate;
  }

  get dateRangeText() {
    const fmtStartDate = this.startDate
      ? format(this.startDate, 'DD-MM-YYYY')
      : '?';
    const fmtEndDate = this.endDate ? format(this.endDate, 'DD-MM-YYYY') : '?';

    return `${fmtStartDate} - ${fmtEndDate}`;
  }

  get dateRange(): DateRange<Date> {
    return new DateRange(this.startDate, this.endDate);
  }
}
