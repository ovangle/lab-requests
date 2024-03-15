import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from "@angular/material/radio";
import { Lab } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { ResearchFundingCostEstimateFormComponent } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { BehaviorSubject, Observable, combineLatest, filter, firstValueFrom, map, of, switchMap } from "rxjs";
import { EquipmentInstallation } from "../installation/equipment-installation";
import { EquipmentInstallationInfoComponent } from "../installation/equipment-installation-info.component";
import { EquipmentProvisionInfoComponent } from "./equipment-provision-info.component";
import { ResizeTextareaOnInputDirective } from "src/app/common/forms/resize-textarea-on-input.directive";
import { EquipmentProvision, EquipmentProvisionService, CreateEquipmentProvisionRequest, AbstractEquipmentProvisionService } from "./equipment-provision";
import { Equipment, EquipmentCreateRequest } from "../equipment";
import { ProvisionStatus, isProvisionStatus } from "./provision-status";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { CostEstimate } from "src/app/research/funding/cost-estimate/cost-estimate";
import { LabEquipmentProvisionService } from "src/app/lab/equipment/provision/lab-equipment-provision";


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

    ResearchFundingCostEstimateFormComponent,
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
        @if (activeProvision$ | async; as activeProvision) {
          <!-- 
            There can be at most one active provision per lab
            so must update the current provision somehow.
          -->
          <equipment-provision-info [equipmentProvision]="activeProvision" />
        } @else if (currentLabInstallation$ | async) {
          <!-- 
            there is an existing installation, so can add additional
            items, but they must go through provisioning
          -->
          <equipment-installation-info [equipment]="$any(equipment)" 
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
              <research-funding-cost-estimate-form 
                [quantityRequired]="form.value.quantityRequired" 
                [funding]="funding" 
                unitOfMeasurement="item" 
                (costEstimateChange)="_onCostEstimateChange($event)" />
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
    {
      provide: AbstractEquipmentProvisionService,
      useClass: LabEquipmentProvisionService
    }
  ]
})
export class CreateEquipmentProvisionForm {

  readonly equipmentSubject = new BehaviorSubject<Equipment | EquipmentCreateRequest | undefined>(undefined);
  readonly equipment$ = this.equipmentSubject.asObservable();

  readonly isNewEquipment$ = this.equipment$.pipe(
    map(equipment => !(equipment instanceof Equipment))
  )

  @Input({ required: true })
  get equipment() {
    return this.equipmentSubject.value!;
  }
  set equipment(equipment: Equipment | EquipmentCreateRequest) {
    this.equipmentSubject.next(equipment);
  }

  readonly provisionService = inject(AbstractEquipmentProvisionService);

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
    cost: new FormControl<number | null>(null),
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
  save = new EventEmitter<EquipmentProvision>();

  get initialStatus() {
    return this.form.value.status!;
  }

  readonly provisionLab$ = this.form.valueChanges.pipe(
    map(value => value.lab || null),
    filter((value): value is Lab => value != null)
  );

  readonly activeProvision$ = combineLatest([
    this.equipment$,
    this.provisionLab$
  ]).pipe(
    map(([ equipment, lab ]) => {
      if (equipment instanceof Equipment && lab instanceof Lab) {
        return equipment.activeProvision(lab)
      }
      return null;
    })
  )

  readonly currentLabInstallation$: Observable<EquipmentInstallation | null> = combineLatest([
    this.equipment$,
    this.provisionLab$,
  ]).pipe(
    map(([ equipment, lab ]) => {
      if (equipment instanceof Equipment) {
        return equipment.currentLabInstallation(lab);
      }
      return null;
    })
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

  ngOnDestroy() {
    this.equipmentSubject.complete();
  }

  async _onFormSubmit() {
    const equipment = await firstValueFrom(this.equipment$);
    const provision = await firstValueFrom(
      this.provisionService.create({
        equipment: equipment!,
        status: this.initialStatus,
        quantityRequired: this.form.value.quantityRequired!,
        reason: this.form.value.reason!,
        lab: this.form.value.lab || null,
        funding: this.form.value.funding || null,
        estimatedCost: this.form.value.cost || 0,
        purchaseUrl: ''
      })
    );
    this.save.emit(provision);
  }

  _onCostEstimateChange(estimate: CostEstimate) {
    this.form.patchValue({
      quantityRequired: estimate.quantityRequired,
      cost: estimate.perUnitCost
    })
  }

}