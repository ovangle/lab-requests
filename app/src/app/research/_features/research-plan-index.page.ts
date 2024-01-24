import { Component, inject } from '@angular/core';
import { BehaviorSubject, Subject, shareReplay, switchMap, tap } from 'rxjs';
import { injectResearchPlanService } from '../plan/research-plan';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

interface Actor {
  readonly role: string;
  readonly email: string;
}

const researcherFixture = {
  role: 'researcher',
  email: 'a@researcher',
};

@Component({
  selector: 'lab-experimental-plan-index',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatListModule
  ],
  template: `
    @if (actor$ | async; as actor) {
      <div>{{ actor | json }}</div>
    }

    <a mat-button routerLink="./create"> + Add </a>

    @if (items$ | async; as items) {
      <mat-list>
        @for (item of items; track item.id) {
          <mat-list-item
            ><a routerLink="./{{ item.id }}">{{ item.title }}</a></mat-list-item
          >
        }
      </mat-list>
    }
  `,
})
export class ResearchPlanIndexPage {
  readonly _models = injectResearchPlanService();

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
