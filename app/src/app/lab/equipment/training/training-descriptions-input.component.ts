import { coerceStringArray } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { NONE_TYPE } from "@angular/compiler";
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AbstractControl, ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInput, MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { BehaviorSubject, Observable, delay, map, share, shareReplay, timer } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { parseTrainingDescriptions } from "./training-descriptions";
import { EquipmentTrainingDescriptionListComponent } from "./training-description-list.component";


@Component({
    selector: 'lab-equipment-training-descriptions-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,

        EquipmentTrainingDescriptionListComponent
    ],
    template: ` 
    <mat-card tabindex="0"
        (focus)="_onInputFocus()"
        (mouseenter)="_onMouseEnterCard()"
        (mouseleave)="_onMouseLeaveCard()"
        (mouseover)="_onMouseOverCard()">
        <mat-card-title>Required training</mat-card-title>
        <mat-card-content>
            <ng-container *ngIf="focused; else readonlyDescriptions">
                <mat-form-field>
                    <textarea matInput #descriptionInput
                              [formControl]="_descriptionTextControl"
                              (focus)="_onInputFocus()"
                              (blur)="_onInputBlur()">
                    </textarea>
                    <mat-hint>
                        Prefix paragraphs with '-' to create multiple descriptions
                    </mat-hint>
                </mat-form-field>
            </ng-container>

            <ng-template #readonlyDescriptions>
                <lab-equipment-training-description-list
                    *ngIf="descriptions$ | async as descriptions"
                    [trainingDescriptions]="descriptions">
                </lab-equipment-training-description-list>
            </ng-template> 
        </mat-card-content>
        <mat-card-footer>
            <ng-content select="#controls"></ng-content>
        </mat-card-footer>
    </mat-card>
    `,
    styles: [`
    mat-form-field {
        padding-top: 10px;
    }
    mat-form-field textarea[matInput] {
        min-height: 200px; 
    }
    `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: EquipmentTrainingDescriptionsInputComponent
        }
    ]
})
export class EquipmentTrainingDescriptionsInputComponent implements ControlValueAccessor {
    
    readonly _descriptionTextControl = new FormControl<string>('', {nonNullable: true})

    readonly descriptions$: Observable<string[]> = this._descriptionTextControl.valueChanges.pipe(
        takeUntilDestroyed(),
        map((input) => parseTrainingDescriptions(input)),
        shareReplay(1)
    )

    _inputFocused = false;
    _cardHovered = false;

    get focused() {
        return this._inputFocused || this._cardHovered;
    }

    constructor() {
        this.descriptions$.subscribe(
            descriptions => {
                console.log('descriptions', descriptions);
                this._onChange(descriptions);
            }
        );
    }

    writeValue(descriptions: string | string[]): void {
        if (Array.isArray(descriptions)) {
            this._descriptionTextControl.setValue(
                descriptions.map(d => '- ' + d).join('\n')
            );
        } else if (typeof descriptions === 'string') {
            this._descriptionTextControl.setValue(descriptions);
        }
    }

    @ViewChild(MatInput, {static: false})
    _descriptionInput: MatInput | null;
    _onInputFocus() {
        console.log('_onInputFocus')
        this._inputFocused = true;
        // Wait a tick so that _descriptionInput is available in dom
        timer(0).subscribe(() => {
            // this focus might have come from the tabindex of the card.
            // Focus the description input if not focused already.
            if (!this._descriptionInput?.focused) {
                this._descriptionInput?.focus();
            }
        });
    }

    _onInputBlur() {
        this._inputFocused = false;
    }

    _onMouseEnterCard() {
        this._cardHovered = true;
    }
    _onMouseOverCard() {
        this._cardHovered = true;
    }

    _onMouseLeaveCard() {
        timer(300).subscribe(() => {
            this._cardHovered = false;
        });
    }

    _onChange = (value: string[]) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this._descriptionTextControl);
}