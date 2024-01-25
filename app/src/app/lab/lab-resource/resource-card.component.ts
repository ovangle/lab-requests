import { Component, Input, inject } from '@angular/core';
import { Resource } from './resource';
import { ResourceType } from './resource-type';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { EquipmentLeaseTableComponent } from '../lab-resources/equipment-lease/equipment-lease-table.component';
import { SoftwareLeaseTableComponent } from '../lab-resources/software-lease/software-resource-table.component';
import { InputMaterialTableComponent } from '../lab-resources/input-material/input-material-resource-table.component';
import { OutputMaterialTableComponent } from '../lab-resources/output-material/output-material-resource-table.component';

@Component({
  selector: 'lab-resource-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,

    EquipmentLeaseTableComponent,
    SoftwareLeaseTableComponent,
    InputMaterialTableComponent,
    OutputMaterialTableComponent,
  ],
  template: `
    @switch (resourceType) {
      @case ('equipment-lease') {
        <lab-equipment-lease-table />
      }
      @case ('software-lease') {
        <lab-software-lease-table />
      }
      @case ('input-material') {
        <lab-input-material-table />
      }
      @case ('output-material') {
        <lab-output-material-table />
      }
    }
  `,
})
export class LabResourceCardComponent<T extends Resource> {
  @Input({ required: true })
  resourceType: ResourceType | undefined = undefined;

  @Input()
  resources: readonly T[] = [];
}
