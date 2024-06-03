import { Component, EventEmitter, Input, Output, computed, inject, input, signal } from "@angular/core";
import { EquipmentProvision } from "./equipment-provision";
import { BehaviorSubject, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { EquipmentProvisionInstallFormComponent } from "./equipment-provision-install.form";
import { EquipmentProvisionApprovalFormComponent } from "./equipment-provision-approval.form";
import { EquipmentProvisionPurchaseFormComponent } from "./equipment-provision-purchase.form";
import { EquipmentContext } from "../equipment-context";
import { ProvisionStatus } from "src/app/lab/common/provisionable/provision-status";
import { LabProvisionInfoComponent } from "src/app/lab/common/provisionable/provision-info.component";
import { toObservable } from "@angular/core/rxjs-interop";
import { EquipmentInstallationService } from "../installation/equipment-installation";
import { EquipmentService } from "../equipment";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { EquipmentInfoComponent } from "../equipment-info.component";
import { EquipmentInstallationInfoComponent } from "../installation/equipment-installation-info.component";
import { EquipmentProvisionTypePipe } from "./equipment-provision-type.pipe";

@Component({
  selector: 'equipment-provision-info',
  standalone: true,
  imports: [
    CommonModule,

    LabProvisionInfoComponent,
    EquipmentProvisionTypePipe,
    EquipmentInfoComponent,
    EquipmentInstallationInfoComponent,

    EquipmentProvisionApprovalFormComponent,
    EquipmentProvisionInstallFormComponent,
    EquipmentProvisionPurchaseFormComponent
  ],
  template: `
  <lab-provision-info
    [provision]="provision()">
    <div #provisionTypeInfo>
      {{ provisionType() | equipmentProvisionType }}
    </div>

    <div #provisionTargetInfo>
      @if (!hideEquipmentInfo()) {
        @if (equipment$ | async; as equipment) {
          <equipment-info [equipment]="equipment" />
        }
      }

      @if (!hideEquipmentInstallationInfo()) {
        @if (equipmentInstallation$ | async; as installation) {
          <equipment-installation-info [installation]="installation" />
        }
      }
    </div>

    <div #provisionForm> 
      @switch (nextStatus()) {
        @case ('approved') {
          <equipment-provision-approval-form
            [equipmentProvision]="provision()" 
            (save)="onProvisionFormSaved($event)" />
        }
        @case ('purchased') {
          <equipment-provision-purchase-form
            [equipmentProvision]="provision()" 
            (save)="onProvisionFormSaved($event)" />
        }
        @case ('installed') {
          <equipment-provision-install-form
            [equipmentProvision]="provision()" 
            (save)="onProvisionFormSaved($event)" />
        }
      }
    </div>

    <div class="actions">
      @switch (provisionStatus()) {
        @case ('requested') {
          <button mat-button (click)="onApproveClick()">Approve</button>
        }
        @case ('approved') {
          <button mat-button (click)="onPurchaseClick()">Purchase</button>
        }
        @case ('purchase') {
          <button mat-button (click)="onInstallClick()">install</button>
        }
      }
    </div>
  </lab-provision-info>
  `
})
export class EquipmentProvisionInfoComponent {
  provision = input.required<EquipmentProvision>();

  @Output()
  provisionSave = new EventEmitter<EquipmentProvision>();

  provisionType = computed(() => this.provision().type);
  provisionStatus = computed(() => this.provision().status);

  _equipmentInstallationService = inject(EquipmentInstallationService);
  readonly equipmentInstallation$ = toObservable(this.provision).pipe(
    switchMap(provision => provision.resolveEquipmentInstallation(this._equipmentInstallationService))
  );
  hideEquipmentInstallationInfo = input(false, { transform: coerceBooleanProperty })

  _equipmentService = inject(EquipmentService);
  readonly equipment$ = toObservable(this.provision).pipe(
    switchMap(provision => provision.resolveEquipment(this._equipmentService))
  )
  hideEquipmentInfo = input(false, { transform: coerceBooleanProperty })

  // The next status of the form which is meant to be 
  // displayed.
  nextStatus = signal<ProvisionStatus | null>(null);

  onApproveClick() {
    this.nextStatus.set('approved')
  }

  onPurchaseClick() {
    this.nextStatus.set('purchased');
  }

  onInstallClick() {
    this.nextStatus.set('installed');
  }

  onProvisionFormSaved(provision: EquipmentProvision) {
    this.provisionSave.next(provision);
  }
}