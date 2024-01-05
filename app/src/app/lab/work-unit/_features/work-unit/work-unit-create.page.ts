import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { defer, firstValueFrom } from 'rxjs';
import { WorkUnitPatch, WorkUnitService } from '../../common/work-unit';
import {
  workUnitForm,
  workUnitPatchFromForm,
} from '../../common/work-unit-form';

const workUnitCreateFixture: Partial<WorkUnitPatch & { planId: string }> = {
  planId: 'e7a33211-1227-4d1d-994d-85a480c15ac0',
  name: 'work unit 1',
  campus: 'ROK',
  labType: 'ICT',
  technician: 'hello@world.com',
  /*
    addSoftwares: [
        new Software({ name: 'MATLAB', description: 'test', minVersion: '3.21' }),
        new Software({ name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304' })
    ],
    addInputMaterials: [
        new InputMaterial({
            name: 'poison',
            baseUnit: 'L',
            hazardClasses: [
                hazardClassFromDivision('1.4'),
                hazardClassFromDivision('6')
            ]
        })
    ]
    */
};

@Component({
  selector: 'lab-work-unit-create-page',
  template: `
    <lab-work-unit-form [form]="form"> </lab-work-unit-form>

    <div class="form-actions">
      <button mat-raised-button (click)="save(); $event.stopPropagation()">
        <mat-icon>save</mat-icon>save
      </button>
    </div>
  `,
  styles: [
    `
      .form-actions button {
        float: right;
      }
    `,
  ],
})
export class WorkUnitCreatePage {
  _cdRef = inject(ChangeDetectorRef);
  readonly service = inject(WorkUnitService);

  readonly form = workUnitForm();
  ngAfterViewInit() {
    this.form.patchValue({
      ...workUnitCreateFixture,
      addEquipments: [],
      replaceEquipments: {},
      addTasks: [],
      replaceTasks: {},
      addSoftwares: [],
      replaceSoftwares: {},
      addInputMaterials: [],
      replaceInputMaterials: {},
      addOutputMaterials: [],
      replaceOutputMaterials: {},
    });
    this._cdRef.detectChanges();
  }

  async save() {
    const patch = workUnitPatchFromForm(this.form);
    return firstValueFrom(this.service.create(patch));
  }
}
