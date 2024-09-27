import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { Equipment, EquipmentQuery, EquipmentService } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { Lab, LabService } from '../../lab/lab';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { LabContext } from 'src/app/lab/lab-context';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { EquipmentInstallationInfoComponent } from '../installation/equipment-installation-info.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Campus } from 'src/app/uni/campus/campus';
import { Discipline } from 'src/app/uni/discipline/discipline';
import { UniCampusSelect } from 'src/app/uni/campus/campus-select.component';
import { MatInputModule } from '@angular/material/input';
import { UniDisciplineSelect } from 'src/app/uni/discipline/discipline-select.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatTableModule,
    EquipmentInstallationInfoComponent,

    UniCampusSelect,
    UniDisciplineSelect,
  ],
  template: `
  <div class="equipment-index-header">
    <h2>Equipment</h2>

    <div class="equipment-controls">
      <a mat-button [routerLink]="['/', {outlets: { form: 'equipment/equipment' }}]">
        Add equipment
      </a>
    </div>
  </div>

  <mat-card class="filters" [formGroup]="filters">
    <mat-card-header>
      Filters
    </mat-card-header>
    <mat-card-content>
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput type="text" formControlName="name"/>

        <button matSuffix mat-icon-button (click)="filters.patchValue({name: ''})">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-form-field>


      <mat-form-field>
        <mat-label>Discipline</mat-label>
        <uni-discipline-select multiple formControlName="discipline" />
        <button matSuffix mat-icon-button (click)="filters.patchValue({discipline: []})">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-form-field>


      <mat-form-field>
        <mat-label>Installed in campus</mat-label>
        <uni-campus-select multiple formControlName="campus" />
        <button matSuffix mat-icon-button (click)="filters.patchValue({campus: []})">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-form-field>
    </mat-card-content>
  </mat-card>

  <main>
    <mat-table [dataSource]="equipments$">
      <ng-container matColumnDef="name">
        <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
        <mat-cell *matCellDef="let equipment">
          <a [routerLink]="['/', {outlets: {default: ['equipment', equipment.id]}}]">{{equipment.name}}</a>
        </mat-cell>

        <mat-header-row *matHeaderRowDef="['name']" />
        <mat-row *matRowDef="let row; columns: ['name'];" />
      </ng-container>
    </mat-table>
  </main>


  `,
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  styles: [
    `
    .equipment-index-header {
      display: flex;
      justify-content: space-between;
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentIndexPage {
  readonly _labService = inject(LabService);
  readonly _equipmentService = inject(EquipmentService);

  readonly _fb = inject(FormBuilder);

  readonly filters = this._fb.group({
    name: this._fb.control<string>(''),
    campus: this._fb.control<Campus[]>([]),
    discipline: this._fb.control<Discipline[]>([])
  });

  readonly pageIndexSubject = new BehaviorSubject(1);

  readonly equipments$ = combineLatest([
    this.filters.valueChanges.pipe(startWith(this.filters.value)),
    this.pageIndexSubject
  ]).pipe(
    switchMap(([filters, index]) => {
      const query: EquipmentQuery = {};

      if (filters.name) {
        query.search = filters.name;
      }
      if (filters.discipline) {
        query.discipline = filters.discipline;
      }
      if (filters.campus) {
        query.installedCampus = filters.campus;
      }

      return this._equipmentService.queryPage(query, index);
    }),
    map(page => page.items),
    tap(page => { console.log('page', page) }),
    shareReplay(1)
  );

  ngOnDestroy() {
    this.pageIndexSubject.complete();
  }


}
