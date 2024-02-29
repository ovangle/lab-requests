import { Component, HostBinding, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, filter, map, of, startWith, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatInputModule } from '@angular/material/input';
import { CampusInfoComponent } from './campus-info.component';
import { Campus, CampusService } from './campus';
import { ModelSearchInputComponent } from 'src/app/common/model/search/search-input-field.component';
import { ModelSearchAutocompleteComponent } from 'src/app/common/model/search/search-autocomplete.component';
import { ModelSearchComponent, ModelSearchControl, provideModelSearchValueAccessor } from 'src/app/common/model/search/search-control';

@Component({
  selector: 'uni-campus-search',
  standalone: true,
  imports: [
    CommonModule,

    MatFormFieldModule,

    CampusInfoComponent,
    ModelSearchInputComponent,
    ModelSearchAutocompleteComponent
  ],
  template: `
  <common-model-search-input-field [search]="searchControl" [required]="required">
    <mat-label>Campus</mat-label>

    <common-model-search-autocomplete />
  </common-model-search-input-field>
  `,
  styles: [
    `
      .mat-form-field {
        width: 100%;
      }
    `,
  ],
  providers: [
    provideModelSearchValueAccessor(CampusSearchComponent)
  ],
})
export class CampusSearchComponent implements ModelSearchComponent<Campus> {
  readonly campusService = inject(CampusService);

  readonly searchControl = new ModelSearchControl<Campus>(
    (search: string) => this.getCampuses(search),
    (campus) => this._displayCampusInfo(campus)
  );

  getCampuses(search: string) {
    return this.campusService.query({ search });
  }

  @HostBinding('[attr.required]')
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  _required: boolean = false;

  _displayCampusInfo(campus: Campus) {
    return `${campus.code} - ${campus.name}`;
  }
}

