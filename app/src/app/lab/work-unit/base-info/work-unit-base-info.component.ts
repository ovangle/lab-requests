import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CampusInfoComponent } from 'src/app/uni/campus/campus-info.component';
import { WorkUnit } from '../common/work-unit';

@Component({
  selector: 'lab-work-unit-base-info',
  standalone: true,
  imports: [ CommonModule, CampusInfoComponent ],
  template: `
    <dl>
      <dt>Technician</dt>
      <dd>{{ workUnit!.supervisorId }}</dd>

      <dt>Process Summary</dt>
      <dd>
        @if (workUnit!.processSummary) {
          {{ workUnit!.processSummary }}
        } @else {
          <p><i>No process description provided</i></p>
        }
      </dd>
    </dl>
  `,
})
export class WorkUnitBaseInfoComponent {
  @Input({ required: true })
  workUnit: WorkUnit | undefined = undefined;
}
