import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Lab } from './lab';
import { RouterModule } from '@angular/router';
import { DisciplinePipe } from '../uni/discipline/discipline.pipe';

@Component({
  selector: 'lab-list-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DisciplinePipe
  ],
  template: `
  <a mat-list-item [routerLink]="['/lab', lab!.id]">
    <span class="lab-discipline">
      {{ lab!.discipline | uniDiscipline}} 
    </span>
    <span class="lab-campus">
      ({{lab!.campus.name}})
    </span>

    <ng-content select=".extra" />
  </a>
  `
})
export class LabListItemComponent {
  @Input({ required: true })
  lab: Lab | undefined;
}

@Component({
  selector: 'lab-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    LabListItemComponent
  ],
  template: `
    <mat-nav-list>
      @for (lab of labs; track lab.id) {
        @if (itemTemplate) {
          <ng-container 
            [ngTemplateOutlet]="itemTemplate"
            [ngTemplateOutletContext]="{$implicit: lab}"
          /> 
        } @else {
          <lab-list-item [lab]="lab" />
        }
      }
    </mat-nav-list>
  `,
})
export class LabListComponent {
  @Input({ required: true })
  labs: ReadonlyArray<Lab> = [];

  @Input()
  itemTemplate: TemplateRef<{ $implicit: Lab; }> | undefined;
}
