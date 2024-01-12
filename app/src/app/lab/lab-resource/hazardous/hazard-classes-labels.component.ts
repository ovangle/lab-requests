import { Component, Input } from '@angular/core';
import {
  HazardClass,
  hazardClassDivision,
  hazardClassLabelImage,
} from './hazardous';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'lab-hazard-class-labels',
  standalone: true,
  imports: [ CommonModule, MatTooltipModule ],
  template: `
    <img
      *ngFor="let hazardClass of hazardClasses"
      [alt]="hazardClass.description"
      [src]="labelImage(hazardClass)"
      width="32px"
      height="32px"
      [matTooltip]="tooltipContent(hazardClass)"
    />
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }
      img {
        margin: 0em 0.2em;
      }
    `,
  ],
})
export class HazardClassLabelsComponent {
  @Input()
  hazardClasses: HazardClass[] = [];
  readonly labelImage = hazardClassLabelImage;

  readonly tooltipContent = (cls: HazardClass) =>
    `${hazardClassDivision(cls)}: ${cls.description}`;
}
