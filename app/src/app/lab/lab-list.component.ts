import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Lab } from './lab';
import { RouterModule } from '@angular/router';
import { DisciplinePipe } from '../uni/discipline/discipline.pipe';

@Component({
  selector: 'lab-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, DisciplinePipe],
  template: `
    <mat-nav-list>
      @for (lab of labs; track lab.id) {
        <a mat-list-item [routerLink]="['/lab', lab.id]">
          <span class="lab-discipline">
            {{ lab.discipline | uniDiscipline}} 
          </span>
          <span class="lab-campus">
            ({{lab.campus.name}})
          </span>
        </a>
      }
    </mat-nav-list>
  `,
})
export class LabListComponent {
  @Input({ required: true })
  labs: ReadonlyArray<Lab> = [];
}
