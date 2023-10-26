import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'lab-work-unit-form-title',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
    <h2>{{action | titlecase}}</h2>

    <div class="form-controls">
        <button mat-icon-button
                [disabled]="saveDisabled"
                (click)="requestSave.emit()">
            <mat-icon>save</mat-icon>
        </button>

        <button mat-icon-button 
                (click)="requestClose.emit()">
            <mat-icon>cancel</mat-icon>
        </button>
    </div>
   `,
   styles: [`
    :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    h2 { margin-bottom: 0; }
   `]
})
export class WorkUnitFormTitleComponent {
    @Input()
    action: string;

    @Input()
    saveDisabled: boolean;

    @Output()
    requestSave = new EventEmitter<void>();
    
    @Output()
    requestClose = new EventEmitter<void>();
}