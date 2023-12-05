import { animate, state, style, transition, trigger } from "@angular/animations";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, ViewEncapsulation } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BehaviorSubject, Subscription } from "rxjs";
import { disabledStateToggler } from "./disable-state-toggler";


@Component({
    selector: 'lab-req-select-other-description',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule
    ],
    template: `
        <mat-form-field>
            <mat-label>Description</mat-label>
            <input matInput
                   [formControl]="_control"
                   required
                   (blur)="_onTouched()"/>

            <!-- TODO: FIXME -->
            @if (_control.value == '') {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>
    `,
    styles: [`
    :host {
        display: block;
        width: 100%;
        overflow: hidden;
    }
    mat-form-field {
        padding-left: 1em;
        box-sizing: border-box;
        width: 100%;
    }
    `],
    animations: [
        trigger('otherDescriptionExpand', [
            state('collapsed', style({width: '0px', minWidth: 0})),
            state('expanded', style({width: '*'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
        ])
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: SelectOtherDescriptionComponent
        }
    ]

})
export class SelectOtherDescriptionComponent implements ControlValueAccessor {

    @HostBinding('@otherDescriptionExpand')
    get _hostExpansionState() {
        return this.isOtherSelected ? 'expanded' : 'collapsed';
    }

    @Input({required: true})
    get isOtherSelected(): boolean {
        return this._otherSelected;
    }
    set isOtherSelected(value: BooleanInput) {
        this._otherSelected = coerceBooleanProperty(value);
    }

    _otherSelected: boolean = false;

    _control = new FormControl<string>('', {nonNullable: true, validators: [Validators.required]})
    _controlSubscriptions: Subscription[] = [];

    ngOnDestroy() {
        this._controlSubscriptions.forEach(s => s.unsubscribe());
    }

    writeValue(obj: any): void {
        this._control.setValue(obj);
    }
    registerOnChange(fn: any): void {
        this._controlSubscriptions.push(
            this._control.valueChanges.subscribe(fn)
        )
    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this._control);
}