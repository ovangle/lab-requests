import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";


@Component({
    selector: 'lab-resource-table-info-header',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule
    ],
    template: `
    <div class="content-centered info-icon">
        <mat-icon>info</mat-icon>
    </div>
    <div class="info-content">
        <p><i><ng-content></ng-content></i></p>
    </div>
    `,
    styles: [`
    :host {
        display: flex;
        margin-bottom: 1em;
    }
    .info-content {
        display: flex;
        align-items: center;
    }
    .info-content p {
        margin-bottom: 0;
    }
    .info-icon {
        margin-right: 1em;
    }
    `]
})
export class ResourceTableInfoHeaderComponent {

}