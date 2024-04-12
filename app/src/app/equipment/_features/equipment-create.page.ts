import { Component, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { EquipmentForm } from "../equipment-form.component";
import { Equipment } from "../equipment";


@Component({
  selector: 'equipment-create-page',
  standalone: true,
  imports: [
    RouterModule,
    EquipmentForm
  ],
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  template: `
  <h1>Add equipment</h1>
  <equipment-form 
    (save)="_onEquipmentSave($event)" />
  `,
})
export class EquipmentCreatePage {
  readonly router = inject(Router);
  readonly activatedRoute = inject(ActivatedRoute);

  async _onEquipmentSave(equipment: Equipment) {
    await this.router.navigate(
      [ '..', equipment.id ],
      { relativeTo: this.activatedRoute }
    );
  }
}