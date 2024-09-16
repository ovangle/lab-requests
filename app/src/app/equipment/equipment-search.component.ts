import { CommonModule } from '@angular/common';
import { Component, Input, inject, input } from '@angular/core';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import {
  Equipment,
  EquipmentService,
} from './equipment';
import { Lab } from '../lab/lab';
import { ModelSearchAutocompleteComponent } from 'src/app/common/model/search/search-autocomplete.component';
import { ModelSearchComponent, ModelSearchControl, NotFoundValue } from 'src/app/common/model/search/search-control';
import { ModelSearchInputComponent } from 'src/app/common/model/search/search-input.component';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { Discipline } from '../uni/discipline/discipline';

let _currentId = 0
function _nextControlId() {
  return _currentId++;
}

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
    <common-model-search-input [searchControl]="searchControl"
                               [modelSearchAutocomplete]="autocomplete" />
    <common-model-search-autocomplete #autocomplete
                                      [searchControl]="searchControl"/>
  `,
  providers: [
    { provide: MatFormFieldControl, useExisting: EquipmentSearchComponent }
  ]
})
export class EquipmentSearchComponent extends ModelSearchComponent<Equipment> {
  readonly controlType = 'equipment-search';
  readonly id = `${this.controlType}-${_nextControlId()}`;

  readonly equipments = inject(EquipmentService);

  constructor() {
    const searchControl = new ModelSearchControl<Equipment>(
      (search) => this.getModelOptions(search),
      (model) => this.formatModel(model),
    );
    super(searchControl);
  }

  /**
   * Show only equipment which has an installation in the given lab.
   */
  lab = input<Lab | null>();
  //
  onlyDiscipline = input<Discipline[] | Discipline | null>([]);
  allowNotFound = input(false, { transform: coerceBooleanProperty });

  getModelOptions(search: string) {
    return this.equipments.query({
      name: search
    });
  }
  formatModel(equipment: Equipment | NotFoundValue) {
    if (equipment instanceof Equipment) {
      return equipment.name;
    } else {
      return `(new) ${equipment.searchInput}`;
    }
  }
}
