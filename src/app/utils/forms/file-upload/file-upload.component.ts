import { CommonModule } from "@angular/common";
import { HttpErrorResponse, HttpEventType, HttpHeaders, HttpUploadProgressEvent } from "@angular/common/http";
import { Component, Injectable, Input, ViewChild } from "@angular/core";
import { ControlValueAccessor, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Observable, Subject } from "rxjs";


export interface FileUploadHandler {
    // The path to upload the file to
    uploadTo: string;
}

class FileUploader {
    // Use XMLHttpRequest since fetch doesn't support upload progress events.
    request: XMLHttpRequest;
    handler: FileUploadHandler;

    constructor(handler: FileUploadHandler) {
        this.request = new XMLHttpRequest();
        this.handler = handler;

        this.request.onprogress = (evt: ProgressEvent) => {
            this._progressSubject.next({
                type: HttpEventType.UploadProgress,
                loaded: evt.loaded,
                total: evt.total
            });
        }

        this.request.onerror = (err: ProgressEvent) => {
            this._errorSubject.next(new HttpErrorResponse({
                error: err,
                headers: new HttpHeaders(this.request.getAllResponseHeaders()),
                statusText: this.request.responseText,
                url: this.request.responseURL
            }));
        }

        this.request.onloadend = () => {
            this.destroy();
        }
    }

    destroy() {
        this._progressSubject.complete();
        this._errorSubject.complete();
        this._resolveLoadEnd();
    }

    readonly _progressSubject = new Subject<HttpUploadProgressEvent>();
    readonly progress$ = this._progressSubject.asObservable();

    readonly _errorSubject = new Subject<HttpErrorResponse>();
    readonly error$ = this._errorSubject.asObservable();

    _resolveLoadEnd: () => void;
    readonly loadend = new Promise<void>((resolve) => {
        this._resolveLoadEnd = resolve;
    });
}

@Component({
    selector: 'lab-req-file-upload-label',
    template: `<ng-content></ng-content>`
})
export class FileUploadLabelComponent {}



@Component({
    selector: 'lab-req-file-upload',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,

        MatFormFieldModule
    ],
    template: `
    <ng-container [formGroup]="_formGroup">
        <mat-form-field>
            <mat-label>
                <ng-content select="lab-req-file-upload-label"></ng-content>
            </mat-label>

            <input matInput type="text" readonly formControlName="fileName" />

            <div matSuffix>
                <button mat-icon-button [disabled]="_formGroup.value.progress">
                    <mat-icon>attach</mat-icon> Choose file...</button>
            </div>
        </mat-form-field>
    </ng-container>
    <input #fileInput hidden="true"
           type="file"
           onclick="this.value=null //clears input so that change event fires every time"
           (change)="_fileInputChange($event)"
           [accept]="_accept.join(',')"/>
    `,
})
export class FileUploadComponent implements ControlValueAccessor {
    readonly _formGroup = new FormGroup({
        fileHandle: new FormControl<string | null>(null),
        progress: new FormControl<boolean>(false, {nonNullable: true})
    });

    @Input({required: true})
    uploadHandler: FileUploadHandler;

    @Input()
    get accept(): readonly string[] {
        return this._accept;
    }
    set accept(value: string | readonly string[]) {
        this._accept = typeof value === 'string'
                ? value.split(',')
                : value;
    }

    _accept: readonly string[];

    _fileInputChange(event: Event) {
        const file = (event.target as HTMLInputElement).files![0];
        if (!file) {
            this._onChange(null);
        }
        this.uploadHandler.upload(file).subscribe((evt: HttpUploadProgressEvent | HttpDon) => {
        })
    }

    get isUploadInProgress() {
        return !!this._formGroup.value.progress;
    }

    writeValue(obj: File | string | null): void {
        if (obj instanceof File) {
            obj = obj.name;
        }
        this._formGroup.patchValue({
            fileHandle: obj,
            progress: false
        });
    }
    _onChange = (value: string | null) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        throw new Error("Method not implemented.");
    }

}