import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Input, inject } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable, debounceTime, firstValueFrom, of, shareReplay, startWith, switchMap } from "rxjs";
import { Lab, LabService } from "./lab";
import { disabledStateToggler } from "../utils/forms/disable-state-toggler";
import { MatInputModule } from "@angular/material/input";
import { DisciplinePipe } from "../uni/discipline/discipline.pipe";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { Discipline, formatDiscipline } from "../uni/discipline/discipline";
import { Campus } from "../uni/campus/campus";
import { HttpParams } from "@angular/common/http";

@Component({
    selector: 'lab-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatAutocompleteModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,

        DisciplinePipe
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="mat-label"></ng-content>
        </mat-label>

        <input matInput [formControl]="_control" [matAutocomplete]="autocomplete"/>

        <mat-error>
            <ng-content select="mat-error"></ng-content>
        </mat-error>

        <button mat-icon-button matIconSuffix
                (click)="_control.setValue(null)">  
        </button>

        <mat-autocomplete #autocomplete [displayWith]="_displayLab"> 
            @if (autocompleteOptions$ | async; as options) {
                @for (lab of options; track lab.id) {
                    <mat-option [value]="lab" (click)="_onTouched()">
                         {{lab.discipline | uniDiscipline}} - {{lab.campus.name}}
                    </mat-option>
                }
            }
        </mat-autocomplete>
    </mat-form-field>
    `,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: LabSearchComponent }
    ]
})
export class LabSearchComponent implements ControlValueAccessor {
    readonly labs = inject(LabService);

    readonly _destroyRef = inject(DestroyRef);
    readonly _control = new FormControl<Lab | string | null>(null);

    @Input()
    campus: Campus | undefined;

    @Input()
    discipline: Discipline | undefined;

    readonly autocompleteOptions$: Observable<Lab[]> = this._control.valueChanges.pipe(
        takeUntilDestroyed(),
        debounceTime(300),
        startWith(null),
        switchMap(searchValue => {
            if (searchValue instanceof Lab) {
                return of([searchValue]);
            } else {
                let params = new HttpParams({
                    fromObject: { search: searchValue || '' }
                });
                if (this.campus) {
                    params = params.set('campus', this.campus.id);
                }
                if (this.discipline) {
                    params = params.set('discipline', this.discipline);
                }

                return this.labs.query(params);
            }
        }),
        shareReplay(1)
    );

    ngOnInit() {
        const syncControlSubscription = this._control.valueChanges.subscribe(value => {
            if (value instanceof Lab || value == null) {
                this._onChange(value);
            }
        })
        this._destroyRef.onDestroy(() => {
            syncControlSubscription.unsubscribe();
        })
    }

    writeValue(obj: string | null): void {
        if (typeof obj === 'string') {
            firstValueFrom(this.labs.fetch(obj)).then(lab => {
                this._control.setValue(lab);
            });
        } else {
            this._control.setValue(null);
        }
    }

    _onChange = (value: Lab | null) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this._control);

    _displayLab(lab: Lab | string | null) {
        if (typeof lab === 'string' || lab == null) {
            return lab || '';
        }
        const discipline = formatDiscipline(lab.discipline);
        return ` ${lab.campus.name} - ${discipline}`
    }
}