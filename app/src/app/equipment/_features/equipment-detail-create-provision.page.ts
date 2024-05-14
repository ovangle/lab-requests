import { Component, Input, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AbstractEquipmentProvisionService, EquipmentProvision, EquipmentProvisionService } from "../provision/equipment-provision";
import { CreateEquipmentProvisionFormComponent } from "../provision/create-equipment-provision.form";
import { EquipmentDetailStateService, EquipmentDetailSubpage } from "./equipment-detail.state";


@Component({
  standalone: true,
  imports: [
    CommonModule,
    CreateEquipmentProvisionFormComponent
  ],
  template: `
  <h2>New provision</h2>
  @if (equipment$ | async; as equipment) {
    <equipment-create-equipment-provision-form
      [equipment]="equipment"
      (save)="_onProvisionSave($event)" />
  }
  `,
  providers: [
    {
      provide: AbstractEquipmentProvisionService,
      useClass: EquipmentProvisionService
    }
  ]
})
export class EquipmentDetailCreateProvisionPage implements EquipmentDetailSubpage {
  readonly subroute = 'create-provision';
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly _equipmentContext = inject(EquipmentContext);
  readonly equipment$ = this._equipmentContext.committed$;

  readonly _equipmentDetailState = inject(EquipmentDetailStateService);

  async _onProvisionSave(_: EquipmentProvision) {
    await this._equipmentContext.refresh();
    this.router.navigate([ '..' ], { relativeTo: this.route });
  }
}