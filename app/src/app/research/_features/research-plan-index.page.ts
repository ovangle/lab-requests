import { Component, inject } from '@angular/core';
import { BehaviorSubject, Subject, shareReplay, switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { ResearchPlanService } from '../plan/research-plan';

interface Actor {
  readonly role: string;
  readonly email: string;
}

const researcherFixture = {
  role: 'researcher',
  email: 'a@researcher',
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatListModule
  ],
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  template: `
  <div class="page-header">
    <h1>Research plans</h1>

    <a mat-raised-button color="primary" routerLink="./create"> + Add </a>
  </div>

    @if (items$ | async; as items) {
      <mat-list>
        @for (item of items; track item.id) {
          <a mat-list-item routerLink="./{{ item.id }}">{{ item.title }}</a>
        }
      </mat-list>
    }
  `,
  styles: `
  .page-header {
    display: flex;
    justify-content: space-between;
  }
  `
})
export class ResearchPlanIndexPage {
  readonly _models = inject(ResearchPlanService);

  readonly actorSubject = new BehaviorSubject<Actor>(researcherFixture);

  readonly actor$ = this.actorSubject.pipe(shareReplay(1));

  readonly items$ = this.actor$.pipe(
    switchMap((actor) => {
      if (actor.role === 'technician') {
        return this._models.query({ technician: actor.email });
      } else if (actor.role === 'researcher') {
        return this._models.query({ researcher: actor.email });
      } else if (actor.role === 'supervisor') {
        return this._models.query({ supervisor: actor.email });
      }
      // Not authorized?
      return [];
    }),
    shareReplay(1),
  );
}
