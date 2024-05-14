import { Component, Input, inject } from "@angular/core";
import { EquipmentProvision } from "./equipment-provision";
import { BehaviorSubject } from "rxjs";
import { CommonModule } from "@angular/common";
import { EquipmentProvisionInstallFormComponent } from "./equipment-provision-install.form";
import { EquipmentProvisionApprovalFormComponent } from "./equipment-provision-approval.form";
import { EquipmentProvisionPurchaseFormComponent } from "./equipment-provision-purchase.form";
import { EquipmentContext } from "../equipment-context";
import { ProvisionStatus } from "src/app/common/provisionable/provision-status";

@Component({
  selector: 'equipment-provision-info',
  standalone: true,
  imports: [
    CommonModule,
    EquipmentProvisionApprovalFormComponent,
    EquipmentProvisionInstallFormComponent,
    EquipmentProvisionPurchaseFormComponent
  ],
  template: `
  @if (nextStatus$ | async; as nextStatus) {
    @switch (nextStatus) {
      @case ('approved') {
        <equipment-provision-approval-form
          [equipmentProvision]="equipmentProvision" 
          (save)="_onProvisionSave($event)" />
      }
      @case ('purchased') {
        <equipment-provision-purchase-form
          [equipmentProvision]="equipmentProvision" 
          (save)="_onProvisionSave($event)" />
      }
      @case ('installed') {
        <equipment-provision-install-form
          [equipmentProvision]="equipmentProvision" 
          (save)="_onProvisionSave($event)" />
      }
    }
  } @else {
    <div class="provision-info">

    </div>
  }


  <div class="actions">
    @switch (status) {
      @case ('requested') {
        <button mat-button>Approve</button>
      }
      @case ('approved') {
        <button mat-button>Purchase</button>
      }
      @case ('purchase') {
        <button mat-button>install</button>
      }
    }
  </div>
  `
})
export class EquipmentProvisionInfoComponent {
  readonly equipmentContext = inject(EquipmentContext);

  @Input({ required: true })
  equipmentProvision: EquipmentProvision | undefined;

  get status(): ProvisionStatus {
    return this.equipmentProvision!.status;
  }

  readonly nextStatusSubject = new BehaviorSubject<ProvisionStatus | null>(null);
  readonly nextStatus$ = this.nextStatusSubject.asObservable();

  _onProvisionSave(saved: EquipmentProvision) {
    this.equipmentProvision = saved;
    this.equipmentContext.refresh();
  }
}