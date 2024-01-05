import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'lab-req-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatRadioModule,
  ],
  template: `
    <p>During this period, I will be using the lab for an estimated</p>
    <mat-form-field>
      <input matInput formControlName="hoursPerUnitDuration" />
      <div matTextSuffix>hours</div>
    </mat-form-field>

    <mat-radio-group aria-label="select a duration" formControlName="duration">
      <mat-radio-button> per week </mat-radio-button>
      <mat-radio-button> per fortnight </mat-radio-button>
    </mat-radio-group>
  `,
})
export class ScheduleFormComponent {}
