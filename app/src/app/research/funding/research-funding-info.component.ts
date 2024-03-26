import { Component, Input } from '@angular/core';
import { ResearchFunding } from './research-funding';
import { CommonModule } from '@angular/common';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'research-funding-info',
  standalone: true,
  imports: [ CommonModule ],
  template: `
    {{ funding!.name }}
  `,
})
export class ResearchFundingInfoComponent {
  @Input({ required: true })
  funding: ResearchFunding | undefined;

  @Input()
  get nameonly(): boolean {
    return this._nameonly;
  }
  set nameonly(value: BooleanInput) {
    this._nameonly = coerceBooleanProperty(value);
  }
  _nameonly: boolean = false;
}
