import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CampusSearchComponent } from 'src/app/uni/campus/campus-search.component';
import {
  WorkUnitForm,
} from './work-unit-form';
import { WorkUnitDurationFormComponent } from '../duration/work-unit-duration-form.component';
import { DisciplineSelectComponent } from 'src/app/uni/discipline/discipline-select.component';

@Component({
  selector: 'lab-work-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,

    CampusSearchComponent,
    DisciplineSelectComponent,
    WorkUnitDurationFormComponent,
  ],
  template: `
    <form [formGroup]="form!">
      @if (isEditableField('name')) {
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required />

          @if (nameErrors && nameErrors['required']) {
            <mat-error>A value is required</mat-error>
          }
        </mat-form-field>
      }

      @if (isEditableField('campus')) {
        <uni-campus-search formControlName="campus" required>
          <mat-label>Campus</mat-label>

          @if (campusErrors && campusErrors['notACampus']) {
            <mat-error>Expected a campus</mat-error>
          }
          @if (campusErrors && campusErrors['required']) {
            <mat-error>A value is required</mat-error>
          }
        </uni-campus-search>
      }

      @if (isEditableField('discipline')) {
        <lab-type-select formControlName="labType" required>
          <mat-label>Lab type</mat-label>
          @if (labTypeErrors && labTypeErrors['required']) {
            <mat-error>A value is required</mat-error>
          }
        </lab-type-select>
      }

      @if (isEditableField('technician')) {
        <mat-form-field>
          <mat-label>technician</mat-label>
          <input matInput formControlName="technician" />

          @if (technicianErrors && technicianErrors['required']) {
            <mat-error>A value is required</mat-error>
          }
          @if (technicianErrors && technicianErrors['email']) {
            <mat-error>Invalid email</mat-error>
          }
        </mat-form-field>
      }

      @if (isEditableField('processSummary')) {
        <mat-form-field>
          <mat-label>Process summary</mat-label>
          <textarea matInput formControlName="processSummary"> </textarea>
        </mat-form-field>
      }

      <lab-work-unit-duration-form [form]="form!" />
    </form>
  `,
})
export class WorkUnitFormComponent {
  @Input({ required: true })
  form: WorkUnitForm | undefined;

  @Input()
  fixedFields: string[] | undefined = undefined;

  isEditableField(name: keyof WorkUnitForm[ 'controls' ]): boolean {
    if (this.fixedFields === undefined) {
      return true;
    }
    return !this.fixedFields.includes(name);
  }

  get nameErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.name.errors;
  }

  get campusErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.campus.errors;
  }

  get labTypeErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.discipline.errors;
  }

  get technicianErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.technician.errors;
  }

  get startDateErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.startDate.errors;
  }
  get endDateErrors(): ValidationErrors | null {
    return this.form! && this.form.controls.endDate.errors;
  }
}
