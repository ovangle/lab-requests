import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

/**
 * Displays a copyable url inside a disabled input component, 
 * with a 'copy to clipboard' button. 
 */
@Component({
    selector: 'common-show-url',
    standalone: true,
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="mat-label" /></mat-label>

        <input matInput type="text" disabled [value]="url!"/>

        <button matIconSuffix mat-icon-button (click)="copyUrlToClipboard()">
            <mat-icon>content_paste_go</mat-icon>
        </button>
    </mat-form-field>
    `
})
export class ShowUrlComponent {
    @Input({ required: true })
    url: string | undefined;

    copyUrlToClipboard() {
        navigator.clipboard.writeText(this.url!);
    }
}