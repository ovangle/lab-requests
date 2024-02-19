import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioGroup, MatRadioModule } from "@angular/material/radio";
import { Lab } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { EquipmentContext } from "../equipment-context";
import { ResearchFundingCostEstimateComponent } from "src/app/research/funding/cost-estimate/cost-estimate.component";
import { CostEstimateFormComponent, costEstimateForm } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { Observable, combineLatest, filter, firstValueFrom, map } from "rxjs";
import { EquipmentInstallation } from "../installation/equipment-installation";
import { LabContextDirective } from "src/app/lab/lab-context";
import { LabEquipmentListComponent } from "src/app/lab/equipment/lab-equipment-list.component";
import { EquipmentInstallationInfoComponent } from "../installation/equipment-installation-info.component";
import { EquipmentProvisionInfoComponent } from "./equipment-provision-info.component";
import { ResizeTextareaOnInputDirective } from "src/app/common/forms/resize-textarea-on-input.directive";
import { LabEquipmentProvision, EquipmentProvisionService, CreateEquipmentProvisionRequest } from "./equipment-provision";
import { EquipmentCreateRequest } from "../equipment";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";


@Component({
  selector: 'equipment-create-equipment-provision-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,

    ResizeTextareaOnInputDirective,

    CostEstimateFormComponent,
    LabSearchComponent,
    EquipmentProvisionInfoComponent,
    ProvisionStatusPipe,
    EquipmentInstallationInfoComponent,
  ],
  template: `
  @if (equipment$ | async; as equipment) {
    <form [formGroup]="form" (ngSubmit)="_onFormSubmit()">
      @if (lab) {
        Provision {{equipment.name}} into {{lab.name}}
      } @else {
        <lab-search formControlName="lab" [required]="isLabRequired" [notFoundTemplate]="notFound">
          <mat-label>Lab</mat-label>
        </lab-search>

        <ng-template #notFound>
          Any lab
        </ng-template>
      }

      @if (provisionLab$ | async; as provisionLab) {
        @if (equipment.activeProvision(provisionLab); as activeProvision) {
          <!-- 
            There can be at most one active provision per lab
            so must update the current provision somehow.
          -->
          <equipment-provision-info [equipmentProvision]="activeProvision" />
        } @else if (equipment.currentLabInstallation(provisionLab)) {

          <!-- 
            there is an existing installation, so can add additional
            items, but they must go through provisioning
          -->
          <equipment-installation-info [equipment]="equipment" 
                                       [lab]="provisionLab" />

          
        } @else {
          <!--
            It is possible we are just belatedly adding a piece of equipment
            which already exists in the lab, so provision process might be
            skipped entirely
          -->

          <p>The equipment: </p>
          <mat-radio-group formControlName="status">
            <mat-radio-button value="requested">
              is requested as new equipment for <em>{{provisionLab.name}}</em>
            </mat-radio-button>
            <br/>
            <mat-radio-button value="installed">
              is already installed in <em>{{provisionLab.name}}</em>, 
              but has not been added previously.
            </mat-radio-button>
          </mat-radio-group>
        }

        <mat-form-field>
          <mat-label>Quantity {{initialStatus | provisionStatus}}</mat-label>
          <input matInput type="number" formControlName="quantityRequired" />
        </mat-form-field>

        @switch (initialStatus) {
          @case ('requested') {
            <mat-form-field>
              <mat-label>Reason</mat-label>
              <textarea matInput resizeOnInput 
                        formControlName="reason">
              </textarea>
            </mat-form-field>

            @if (funding) {
              <uni-research-funding-cost-estimate-form 
                [form]="form.controls.cost" 
                [quantityRequired]="form.value.quantityRequired" 
                [funding]="funding" 
                unitOfMeasurement="item" />
            }
          }
          @case ('installed') {
            <mat-form-field>
              <mat-label>Notes</mat-label>
              <textarea matInput resizeOnInput formControlName="reason">
              </textarea>
            </mat-form-field>
          }
          @default {
            Error: Invalid provision status on create '{{initialStatus | provisionStatus}}'.
          }
        }

        <div class="form-controls">
          <button mat-button type="submit">
            <mat-icon>save</mat-icon>Save
          </button>
        </div>
      }
    </form>
  }
  `,
  providers: [
    EquipmentProvisionService
  ]
})
export class CreateEquipmentProvisionForm {
  readonly context = inject(EquipmentContext);
  readonly equipment$ = this.context.committed$;

  readonly provisionService = inject(EquipmentProvisionService);

  readonly form = new FormGroup({
    status: new FormControl<ProvisionStatus>('requested', { nonNullable: true }),
    reason: new FormControl<string>('', { nonNullable: true }),

    lab: new FormControl<Lab | null>(null, {
      validators: (c) => {
        if (this.form && this.isLabRequired) {
          return Validators.required(c);
        }
        return null;
      }
    }),
    funding: new FormControl<ResearchFunding | null>(null, {
      validators: (c) => {
        if (this.form && this.isFundingRequired) {
          return Validators.required(c);
        }
        return null;
      }
    }),
    cost: costEstimateForm(),
    quantityRequired: new FormControl<number>(1, {
      nonNullable: true,
      validators: [ Validators.required, Validators.min(1) ]
    })
  });

  @Input()
  set lab(lab: Lab | null) {
    this.form.patchValue({ lab });
    this._lab = lab;
  }
  get lab() {
    return this._lab;
  }
  _lab: Lab | null = null;

  @Output()
  save = new EventEmitter<LabEquipmentProvision>();

  get initialStatus() {
    return this.form.value.status!;
  }

  readonly provisionLab$ = this.form.valueChanges.pipe(
    map(value => value.lab || null),
    filter((value): value is Lab => value != null)
  );

  readonly currentLabInstallation$: Observable<EquipmentInstallation | null> = combineLatest([
    this.equipment$,
    this.provisionLab$,
  ]).pipe(
    map(([ equipment, lab ]) => equipment.currentLabInstallation(lab))
  );

  @Input()
  get funding() {
    return this._funding;
  }
  set funding(funding: ResearchFunding | null) {
    this.form.patchValue({ funding });
    this._funding = funding;
  }
  _funding: ResearchFunding | null = null;

  get isLabRequired() {
    return this.form.value.status !== 'requested';
  }

  get isFundingRequired() {
    return this.form.value.status !== 'requested'
      && this.form.value.status !== 'installed';
  }

  async _onFormSubmit() {
    const provision = await firstValueFrom(
      this.provisionService.create({
        status: this.initialStatus,
        quantityRequired: this.form.value.quantityRequired!,
        reason: this.form.value.reason!,
        lab: this.form.value.lab || null,
        funding: this.form.value.funding || null,
        estimatedCost: this.form.value.cost?.perUnitCost || 0,
        purchaseUrl: ''
      })
    );
    this.save.emit(provision);
  }

}