import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CampusSearchComponent } from 'src/app/uni/campus/campus-search.component';
import {
  WorkUnitForm,
  WorkUnitFormErrors,
  workUnitFormErrors,
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

          @if (nameErrors?.required) {
            <mat-error>A value is required</mat-error>
          }
        </mat-form-field>
      }

      @if (isEditableField('campus')) {
        <uni-campus-search formControlName="campus" required>
          <mat-label>Campus</mat-label>

          @if (campusErrors?.notACampus) {
            <mat-error>Expected a campus</mat-error>
          }
          @if (campusErrors?.required) {
            <mat-error>A value is required</mat-error>
          }
        </uni-campus-search>
      }

      @if (isEditableField('discipline')) {
        <lab-type-select formControlName="labType" required>
          <mat-label>Lab type</mat-label>
          @if (labTypeErrors?.required) {
            <mat-error>A value is required</mat-error>
          }
        </lab-type-select>
      }

      @if (isEditableField('technician')) {
        <mat-form-field>
          <mat-label>technician</mat-label>
          <input matInput formControlName="technician" />

          @if (technicianErrors?.required) {
            <mat-error>A value is required</mat-error>
          }
          @if (technicianErrors?.email) {
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

  isEditableField(name: keyof WorkUnitForm['controls']): boolean {
    if (this.fixedFields === undefined) {
      return true;
    }
    return !this.fixedFields.includes(name);
  }

  get nameErrors(): WorkUnitFormErrors['name'] {
    return workUnitFormErrors(this.form!, 'name');
  }

  get campusErrors(): WorkUnitFormErrors['campus'] {
    return workUnitFormErrors(this.form!, 'campus');
  }

  get labTypeErrors(): WorkUnitFormErrors['discipline'] {
    return workUnitFormErrors(this.form!, 'discipline');
  }

  get technicianErrors(): WorkUnitFormErrors['technician'] {
    return workUnitFormErrors(this.form!, 'technician');
  }

  get startDateErrors(): WorkUnitFormErrors['startDate'] {
    return workUnitFormErrors(this.form!, 'startDate');
  }
  get endDateErrors(): WorkUnitFormErrors['endDate'] {
    return workUnitFormErrors(this.form!, 'endDate');
  }
}
