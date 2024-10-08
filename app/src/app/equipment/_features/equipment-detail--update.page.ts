import { Component, inject } from "@angular/core";
import { EquipmentFormComponent } from "../equipment-form.component";
import { CommonModule } from "@angular/common";
import { EquipmentContext } from "../equipment-context";
import { Equipment } from "../equipment";
import { ActivatedRoute, Router } from "@angular/router";
import { EquipmentDetailSubpage, EquipmentDetailStateService } from "./equipment-detail.state";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    EquipmentFormComponent
  ],
  template: `
  `
})
export class EquipmentDetailUpdatePage {
  readonly subroute = 'update';
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly equipmentContext = inject(EquipmentContext);
  readonly equipment$ = this.equipmentContext.committed$;

  readonly _equipmentDetailState = inject(EquipmentDetailStateService);

  async _onEquipmentSave(equipment: Equipment) {
    this.equipmentContext.nextCommitted(equipment);
    await this.router.navigate(['..'], { relativeTo: this.route });
  }
}