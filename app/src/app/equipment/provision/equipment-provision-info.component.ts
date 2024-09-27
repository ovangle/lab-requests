import { Component, EventEmitter, Input, Output, computed, inject, input, signal } from "@angular/core";
import { EquipmentInstallationProvision, EquipmentTransferProvision as TransferEquipmentProvision, NewEquipmentProvision } from "./equipment-provision";
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

type ProvisionDisplayStyle = 'one-line';

@Component({
  selector: 'equipment-provision-info--new-equipment-provision',
  standalone: true,
  imports: [
    CommonModule,
    EquipmentInfoComponent
  ],
  template: `
  <equipment-info [equipment]="provision().equipment" />
  {{provision().numRequired}}
  `
})
export class EquipmentProvisionInfo__NewEquipmentProvision {
  provision = input.required<NewEquipmentProvision>();
  display = input<ProvisionDisplayStyle>('one-line');
}

@Component({
  selector: 'equipment-provision-info--transfer-equipment-provision',
  standalone: true,
  template: `
  `
})
export class EquipmentProvisionInfo__TransferEquipmentProvision {
  provision = input.required<TransferEquipmentProvision>();
  display = input<ProvisionDisplayStyle>('one-line');
}

@Component({
  selector: 'equipment-provision-info',
  standalone: true,
  imports: [
    CommonModule,

    EquipmentProvisionInfo__NewEquipmentProvision,
    EquipmentProvisionInfo__TransferEquipmentProvision
  ],
  template: `
  @switch (provisionAction()) {
    @case ('new_equipment') {
      <equipment-provision-info--new-equipment-provision
        [provision]="_newEquipmentProvision()"
        [display]="display()" />
    }
    @case ('transfer_equipment') {
      <equipment-provision-info--transfer-equipment-provision
        [provision]="_transferEquipmentProvision()"
        [display]="display()" />
    }
  }

  <!--
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
  -->
  `
})
export class EquipmentProvisionInfoComponent {
  provision = input.required<EquipmentInstallationProvision>();

  provisionAction = computed(() => this.provision().action);
  _newEquipmentProvision = computed(() => this.provision() as NewEquipmentProvision);
  _transferEquipmentProvision = computed(() => this.provision() as TransferEquipmentProvision);

  display = input<ProvisionDisplayStyle>('one-line');

  /*
  @Output()
  provisionSave = new EventEmitter<EquipmentInstallationProvision>();

  provisionStatus = computed(() => this.provision().status);

  _equipmentInstallationService = inject(EquipmentInstallationService);
  readonly equipmentInstallation$ = toObservable(this.provision).pipe(
    switchMap(provision => this._equipmentInstallationService.nextCommitted(provision.prov))
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

  onProvisionFormSaved(provision: EquipmentInstallationProvision) {
    this.provisionSave.next(provision);
  }
    */
}