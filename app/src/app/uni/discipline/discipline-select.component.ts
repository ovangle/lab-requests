import { CommonModule, formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, ViewEncapsulation, inject } from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { DISCLIPLINES, Discipline, disciplineFromJson, formatDiscipline } from './discipline';
import { MatFormFieldModule } from '@angular/material/form-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { DisciplinePipe } from './discipline.pipe';
import { modelEnumMetaProviders, ModelEnumSelect } from 'src/app/common/model/forms/abstract-enum-select.component';
import { AbstractFormFieldInput, formFieldInputProviders } from 'src/app/common/forms/abstract-form-field-input.component';

@Component({
  selector: 'uni-discipline-select-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModelEnumSelect,
  ],
  viewProviders: [
    ...modelEnumMetaProviders<Discipline>({
      name: 'uni-discipline',
      values: DISCLIPLINES,
      formatValue: formatDiscipline,
    })
  ],
  template: `<common-model-enum-select [formControl]="formControl" />`,
  providers: [
    ...formFieldInputProviders('uni-discipline-select', UniDisciplineSelect)
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class UniDisciplineSelect extends AbstractFormFieldInput<UniDisciplineSelect> {
  readonly _destroyRef = inject(DestroyRef);
}
