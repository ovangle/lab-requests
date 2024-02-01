import { Component, Injectable, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Lab, injectLabService } from '../lab';
import { Observable, ReplaySubject, shareReplay, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DisciplinePipe } from 'src/app/uni/discipline/discipline.pipe';

export function labFromActivatedRoute(): Observable<Lab> {
  const route = inject(ActivatedRoute);
  const labs = injectLabService();

  return route.paramMap.pipe(
    switchMap(params => {
      const labId = params.get('lab_id')
      if (labId == null) {
        throw new Error('No :lab_id in activated route');
      }
      return labs.fetch(labId);
    }),
    shareReplay(1)
  );
}

/**
 * This is the view of a lab from a technician in another lab.
 */
@Component({
  selector: 'lab-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    DisciplinePipe
  ],
  template: `
  @if (lab$ | async; as lab) {
    <h1>{{lab.campus.name}} - {{lab.discipline | uniDiscipline}} Lab</h1>
    <router-outlet />
  }
  `
})
export class LabProfilePage {
  readonly lab$ = labFromActivatedRoute();
}
