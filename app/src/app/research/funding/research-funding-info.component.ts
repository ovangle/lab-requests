import { Component, Input } from '@angular/core';
import { ResearchFunding } from './research-funding';
import { CommonModule } from '@angular/common';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'uni-research-funding-model-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    {{ fundingModel.name }}
    @if (!nameonly) {
      - {{ fundingModel.description }}
    }
  `,
})
export class FundingModelInfoComponent {
  @Input({ required: true })
  fundingModel: ResearchFunding;

  @Input()
  get nameonly(): boolean {
    return this._nameonly;
  }
  set nameonly(value: BooleanInput) {
    this._nameonly = coerceBooleanProperty(value);
  }
  _nameonly: boolean = false;
}
