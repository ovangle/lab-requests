import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ExperimentalPlan } from './experimental-plan';

@Component({
  selector: 'lab-experimental-plan-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  template: ``,
})
export class ExperimentalPlanListComponent {
  @Input({ required: true })
  plans: readonly ExperimentalPlan[];
}
