import { Component, inject } from "@angular/core";
import { EquipmentForm } from "../equipment-form.component";
import { CommonModule } from "@angular/common";
import { EquipmentContext } from "../equipment-context";
import { Equipment } from "../equipment";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    EquipmentForm
  ],
  template: `
  @if (equipment$ | async; as equipment) {
    <h1>Update {{equipment.name}}</h1>

    <equipment-form
      (save)="_onEquipmentSave($event)" />
  }
  `
})
export class EquipmentDetailUpdatePage {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly equipmentContext = inject(EquipmentContext);
  readonly equipment$ = this.equipmentContext.committed$;

  async _onEquipmentSave(equipment: Equipment) {
    this.equipmentContext.nextCommitted(equipment);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }
}