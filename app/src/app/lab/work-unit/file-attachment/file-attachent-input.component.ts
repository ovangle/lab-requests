import { CommonModule } from "@angular/common";
import { Component, Pipe, PipeTransform } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { BehaviorSubject } from "rxjs";
import { StoredFile } from "src/app/common/file/stored-file";
import { WorkUnitFileAttachment } from "./file-attachment";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

const SI_PREFIXES: [string, number][] = [
    ['k', 1e3],
    ['M', 1e6],
    ['G', 1e9]
];

@Pipe({
    name: 'fileSize',
    standalone: true
})
export class FileSizePipe implements PipeTransform {
    transform(value: number, ...args: any[]) {
        for (const [prefix, magnitude] of SI_PREFIXES.reverse()) {
            if (value / magnitude > 1) {
                return `${value / magnitude} ${prefix}B`
            }
        }
        return `${value} bytes`;
    }
}


@Component({
    selector: 'lab-work-unit-file-attachment',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,

        FileSizePipe
    ],
    template: `
    <mat-card>
        <mat-card-header> 
            <ng-content select=".title" />
        </mat-card-header>
        <mat-card-content>
            <ng-content />
        </mat-card-content>
        <mat-card-footer>
            <ng-container *ngIf="storedFile$ | async as storedFile; else nullSelection">
                <div class="file-description">
                    {{storedFile.origFilename}} ({{storedFile.size | fileSize}}
                </div>

                <button mat-icon-button (click)="uploadFile($event)"> 
                    <mat-icon>attachment</mat-icon>
                </button>
            </ng-container>

            <ng-template #nullSelection>
                None
            </ng-template>
        </mat-card-footer>
    </mat-card>
    `
})
export class WorkUnitFileAttachmentComponent {
    readonly _storedFileSubject = new BehaviorSubject<WorkUnitFileAttachment | null>(null);
    readonly storedFile$ = this._storedFileSubject.asObservable();

}