import { Component, Input, inject, model, signal } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { EquipmentProvision, EquipmentProvisionService, EquipmentProvisionType } from "../provision/equipment-provision";
import { EquipmentDetailStateService, EquipmentDetailSubpage } from "./equipment-detail.state";
import { NewEquipmentFormComponent } from "../provision/equipment-new-equipment-form.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioChange, MatRadioModule } from "@angular/material/radio";
import { DeclareEquipmentFormComponent } from "../provision/equipment-declare-equipment-form.component";
import { Observable, combineLatest, filter, map, of, switchMap } from "rxjs";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { Lab } from "src/app/lab/lab";
import { toObservable } from "@angular/core/rxjs-interop";
import { EquipmentInstallation, EquipmentInstallationCreateRequest } from "../installation/equipment-installation";
import { NotFoundValue } from "src/app/common/model/search/search-control";


@Component({
  standalone: true,
  imports: [
    CommonModule,

    MatRadioModule,

    LabSearchComponent,
    NewEquipmentFormComponent,
    DeclareEquipmentFormComponent
  ],
  template: `
  <h2>New provision</h2>

  <lab-search [value]="targetLab()" (valueChange)="onTargetLabChange($event)">
    <div #formFieldLabel>Into lab</div>
  </lab-search>

  <div>
    <p>I want to
    <mat-radio-group [value]="selectedFlow()" (change)="onSelectedFlowChange($event)">
      <mat-radio-button value="new_equipment">
        add new equipment to the page.
      </mat-radio-button>
      <mat-radio-button value="declare_equipment">
        declare equipment which already exists in the lab
      </mat-radio-button>
    </mat-radio-group>
  </div>

  @if (provisionTarget$ | async; as provisionTarget) {
    @switch (selectedFlow()) {
      @case ('new_equipment') {
        <equipment-new-equipment-form
          [target]="provisionTarget"
          (save)="_onProvisionSave($event)" />
      }
      @case ('declare_equipment') {
        <equipment-declare-equipment-form
          [target]="provisionTarget"
          (save)="_onProvisionSave($event)" />
      }
    }
  }
  `,
})
export class EquipmentDetailCreateProvisionPage implements EquipmentDetailSubpage {
  readonly subroute = 'create-provision';
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  selectedFlow = model<EquipmentProvisionType>('new_equipment');

  onSelectedFlowChange(change: MatRadioChange) {
    this.selectedFlow.set(change.value);
  }

  targetLab = model<Lab>();
  onTargetLabChange(lab: Lab | NotFoundValue | undefined) {
    if (lab instanceof NotFoundValue) {
      lab = undefined;
    }
    this.targetLab.set(lab);
  }

  readonly _equipmentContext = inject(EquipmentContext);
  readonly equipment$ = this._equipmentContext.committed$;

  readonly labDisciplines$ = this.equipment$.pipe(
    map(equipment => equipment.disciplines)
  );

  readonly _equipmentDetailState = inject(EquipmentDetailStateService);

  async _onProvisionSave(_: EquipmentProvision) {
    await this._equipmentContext.refresh();
    await this.router.navigate([ '..' ], { relativeTo: this.route });
  }

  readonly provisionTarget$: Observable<EquipmentInstallation | EquipmentInstallationCreateRequest> = combineLatest([
    this.equipment$,
    toObservable(this.targetLab).pipe(
      filter((maybeLab): maybeLab is Lab => maybeLab != null)
    )
  ]).pipe(
    map(([ equipment, lab ]) => {
      const currentInstallation = equipment.getCurrentInstallation(lab);
      if (currentInstallation) {
        return currentInstallation
      }
      return {
        equipment: equipment,
        lab: lab
      };
    })
  );
}