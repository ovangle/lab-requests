import { ChangeDetectionStrategy, Component, inject, input, model, viewChild } from "@angular/core";
import { Campus, CampusService } from "./campus";
import { CommonModule } from "@angular/common";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { MatFormFieldControl } from "@angular/material/form-field";
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from "@angular/forms";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { AsyncSubject, BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";

let _currentId = 0;
function _nextControlId() {
    return _currentId++;
}

@Component({
    selector: 'uni-campus-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule
    ],
    template: `
    <mat-select [value]="value" (valueChange)="writeValue($event); _onChange($event)"
                [multiple]="multiple()"
                [required]="_required()"
                [disabled]="disabled">
        @if (allCampuses$ | async; as campuses) {
            @for (campus of campuses; track campus.id) {
                <mat-option [value]="campus">
                    {{campus.name}}
                </mat-option>
            }
        }
        @if (!multiple()) {
            <mat-option [value]="null">None</mat-option>
        }
    </mat-select>
    `,
    providers: [
        { provide: MatFormFieldControl, useExisting: UniCampusSelect },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniCampusSelect implements MatFormFieldControl<Campus>, ControlValueAccessor {
    readonly _viewInit = new AsyncSubject<boolean>();

    ngAfterViewInit() {
        this._viewInit.next(true);
        this._viewInit.complete();
    }

    _describedByIdsSubject = new BehaviorSubject<string[]>([]);
    setDescribedByIds(ids: string[]): void {
        this._describedByIdsSubject.next(ids);
    }

    onContainerClick(event: MouseEvent): void {
        this._matSelect().onContainerClick();
    }
    readonly _campusService = inject(CampusService);

    allCampuses$ = this._campusService.query({});

    readonly controlType = 'uni-campus-select';
    readonly id: string;
    readonly placeholder = '';
    get shouldLabelFloat() {
        return !this.empty || this.focused;
    }

    readonly ngControl = inject(NgControl, { self: true });
    readonly _matSelect = viewChild.required(MatSelect);

    readonly multiple = input(false, { transform: coerceBooleanProperty });

    readonly _value = model<Campus | null>(null);
    get value() { return this._value(); }

    readonly _required = input(false, { transform: coerceBooleanProperty });
    get required() { return this._required(); }
    readonly _requiredChange = toObservable(this._required).pipe(map(() => undefined));

    constructor() {
        this.id = `${this.controlType}-${_nextControlId()}`;
        this.ngControl.valueAccessor = this;
    }

    autofilled?: boolean | undefined = undefined;
    userAriaDescribedBy?: string | undefined = undefined;
    disableAutomaticLabeling?: boolean | undefined = undefined;

    get _formControl(): FormControl {
        if (this.ngControl.control instanceof FormControl) {
            return this.ngControl.control;
        }
        throw new Error(`Not bound to a form control`);
    }

    get errorState() {
        return !this.ngControl.valid;
    }

    readonly disabledSubject = new BehaviorSubject(false);
    get disabled() {
        return this.disabledSubject.value;
    }

    get focused() {
        return this._matSelect().focused;
    }

    get empty() {
        return this.value == null;
    }

    readonly stateChanges = this._viewInit.pipe(
        switchMap((_: boolean) => combineLatest([
            this._formControl.valueChanges,
            this._formControl.statusChanges,
            this._requiredChange,
            this.disabledSubject
        ])),
        map(() => undefined)
    );

    writeValue(obj: any): void {
        this._value.set(obj);
    }
    _onChange = (value: any) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabledSubject.next(isDisabled);
    }
}