import { Component, Input } from '@angular/core';
import { ResourceStorage } from './resource-storage';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lab-resource-storage',
  standalone: true,
  imports: [ CommonModule ],
  template: `
    <div>
      <h4>Storage</h4>

      @if (storage) {
        <div class="storage-type">Type: {{ storage.description }}</div>
      } @else {
        No storage required
      }
    </div>
  `,
})
export class ResourceStorageDetailsComponent {
  @Input()
  storage: ResourceStorage | null = null;
}
