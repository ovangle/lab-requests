import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EquipmentProvision } from "./equipment-provision";
import { EquipmentProvisionPurchaseCostEstimateForm } from "./equipment-provision-purchase-cost-estimate.form";


@Component({
  selector: 'equipment-provision-approval-form',
  standalone: true,
  imports: [
    EquipmentProvisionPurchaseCostEstimateForm
  ],
  template: ``
})
export class EquipmentProvisionApprovalFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentProvision>();
}