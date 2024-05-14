import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  Equipment,
  EquipmentService,
  equipmentQueryToHttpParams,
} from './equipment';
import { Lab } from '../lab/lab';
import { ModelSearchAutocompleteComponent } from 'src/app/common/model/search/search-autocomplete.component';
import { ModelSearchComponent, ModelSearchControl, NotFoundValue, provideModelSearchValueAccessor } from 'src/app/common/model/search/search-control';
import { ModelSearchInputComponent } from 'src/app/common/model/search/search-input-field.component';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'equipment-search',
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

      <common-model-search-autocomplete />
    </common-model-search-input-field>
  `,
  providers: [
    provideModelSearchValueAccessor(EquipmentSearchComponent)
  ],
})
export class EquipmentSearchComponent implements ModelSearchComponent<Equipment> {

  readonly equipments = inject(EquipmentService);

  readonly searchControl = new ModelSearchControl<Equipment>(
    (search) => this.getModelOptions(search),
    (model) => this.formatModel(model),
  );

  /**
   * Show only equipment which has an installation in the given lab.
   */
  @Input()
  inLab: Lab | null = null;

  @Input()
  get allowNotFound() {
    return this.searchControl.allowNotFound;
  }
  set allowNotFound(input: BooleanInput) {
    this.searchControl.allowNotFound = coerceBooleanProperty(input);
  }

  getModelOptions(search: string) {
    return this.equipments.query({
      name: search
    });
  }
  formatModel(equipment: Equipment) {
    return equipment.name;
  }
  formatNotFoundValue(notFoundValue: NotFoundValue) {
    return '(new) ' + notFoundValue.searchInput;
  }
}
