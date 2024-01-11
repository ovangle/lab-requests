import { Component, Input, inject } from '@angular/core';
import { Resource } from './resource';
import { ResourceType } from './resource-type';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { EquipmentLeaseTableComponent } from '../lab-resources/equipment-lease/equipment-lease-table.component';
import { SoftwareResourceTableComponent } from '../lab-resources/software-lease/software-resource-table.component';
import { InputMaterialTableComponent } from '../lab-resources/input-material/input-material-resource-table.component';
import { OutputMaterialResourceTableComponent } from '../lab-resources/output-material/output-material-resource-table.component';

@Component({
  selector: 'lab-resource-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,

    EquipmentLeaseTableComponent,
    SoftwareResourceTableComponent,
    InputMaterialTableComponent,
    OutputMaterialResourceTableComponent,
  ],
  template: `
    @switch (resourceType) {
      @case ('equipment-lease') {
        <lab-equipment-lease-table />
      }
      @case ('software-lease') {
        <lab-software-resource-table />
      }
      @case ('input-material') {
        <lab-input-material-resource-table />
      }
      @case ('output-material') {
        <lab-output-material-resource-table />
      }
    }
  `,
})
export class WorkUnitResourceInfo<T extends Resource> {
  @Input({ required: true })
  resourceType: ResourceType;

  @Input()
  resources: readonly T[];
}
