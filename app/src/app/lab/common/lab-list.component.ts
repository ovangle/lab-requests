import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Lab } from './lab';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lab-list',
  standalone: true,
  imports: [ CommonModule, RouterModule, MatListModule ],
  template: `
    <mat-nav-list>
      @for (lab of labs; track lab.id) {
        <a mat-list-item [routerLink]="['/lab', lab.id]">
          {{ lab.type }}
        </a>
      }
    </mat-nav-list>
  `,
})
export class LabListComponent {
  @Input({ required: true })
  labs: ReadonlyArray<Lab> = [];
}
