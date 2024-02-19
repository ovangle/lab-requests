import { Component, Input, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Observable, map, of } from "rxjs";
import { Equipment } from "../equipment";
import { LabEquipmentProvision } from "../provision/equipment-provision";
import { CreateEquipmentProvisionForm } from "../provision/create-equipment-provision.form";


@Component({
  standalone: true,
  imports: [
    CommonModule,
    CreateEquipmentProvisionForm
  ],
  template: `
  <h2>New provision</h2>
  @if (equipment$ | async; as equipment) {
    <equipment-create-equipment-provision-form
      (save)="_onProvisionSave($event)" />
  }
  `,
})
export class EquipmentDetailCreateProvisionPage {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly _equipmentContext = inject(EquipmentContext);
  readonly equipment$ = this._equipmentContext.committed$;

  ngOnInit() {
    this.equipment$.subscribe(
      equipment => console.log('context equipment !!', equipment)
    )
  }

  async _onProvisionSave(_: LabEquipmentProvision) {
    await this._equipmentContext.refresh();
    this.router.navigate([ '..' ], { relativeTo: this.route });
  }
}