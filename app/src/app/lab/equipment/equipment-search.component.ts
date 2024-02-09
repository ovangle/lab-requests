import { validate as validateIsUUID } from 'uuid';
import { CommonModule } from '@angular/common';
import { Component, Injectable, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  map,
} from 'rxjs';
import {
  Equipment,
  EquipmentCollection,
  equipmentQueryToHttpParams,
  injectEquipmentService,
} from './equipment';
import { EquipmentLike } from './equipment-like';
import { isUUID } from 'src/app/utils/is-uuid';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { EquipmentProvisionRequestFormComponent } from './provision/equipment-provision-request-form.component';
import { Lab } from '../lab';
import { LabEquipmentProvision, LabEquipmentProvisionRequest } from './provision/lab-equipment-provision';
import { ModelSearchAutocompleteComponent } from 'src/app/common/model/search/search-autocomplete.component';
import { ModelSearchComponent, ModelSearchControl, provideValueAccessor } from 'src/app/common/model/search/search-control';
import { ModelSearchInputComponent } from 'src/app/common/model/search/search-input-field.component';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'lab-equipment-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,

    ModelSearchInputComponent,
    ModelSearchAutocompleteComponent
  ],
  template: `
    <common-model-search-input-field [search]="searchControl">
      <mat-label><ng-content select="mat-label" /></mat-label>

      <common-model-search-autocomplete [search]="searchControl" />
    </common-model-search-input-field>
  `,
  providers: [
    EquipmentCollection,
    provideValueAccessor(EquipmentSearchComponent)
  ],
})
export class EquipmentSearchComponent implements ModelSearchComponent<Equipment> {

  readonly equipments = injectEquipmentService();

  readonly searchControl = new ModelSearchControl<Equipment>(
    (search) => this.getModelOptions(search),
    (model) => this.formatModel(model),
  );

  /**
   * Show only equipment installed into the given lab.
   */
  @Input({ required: true })
  inLab: Lab | null = null;

  @Input()
  get allowNotFound() {
    return this.searchControl.allowNotFound;
  }
  set allowNotFound(input: BooleanInput) {
    this.searchControl.allowNotFound = coerceBooleanProperty(input);
  }

  getModelOptions(search: string) {
    return this.equipments.query(equipmentQueryToHttpParams({
      lab: this.inLab,
      name: search
    }));
  }
  formatModel(equipment: Equipment) {
    return equipment.name;
  }
}
