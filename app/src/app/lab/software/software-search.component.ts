import { CommonModule } from "@angular/common";
import { Component, Injectable, Input, inject } from "@angular/core";
import { ControlValueAccessor, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { LabSoftwareRequestFormComponent } from "./software-request-form.component";
import { NewSoftwareRequest, Software, SoftwareModelService, isNewSoftwareRequest } from "./software";
import { ModelCollection } from "src/app/utils/models/model-collection";
import { BehaviorSubject, Observable, defer, map, of, startWith, switchMap } from "rxjs";
import { isThisQuarter } from "date-fns";
import { isEquipmentRequest } from "../equipment/equipment";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";

@Injectable()
export class SoftwareModelCollection extends ModelCollection<Software> {
    readonly models = inject(SoftwareModelService);
}

const _NEW_SOFTWARE_ = '_NEW_SOFTWARE_'

@Component({
    selector: 'lab-software-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatAutocompleteModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        LabSoftwareRequestFormComponent
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="mat-label"></ng-content></mat-label>

        <input matInput 
                [matAutocomplete]="autocomplete"
                [formControl]="searchControl" />
            
        <mat-autocomplete #autocomplete>
            <ng-container *ngIf="searchOptions$ | async as searchOptions">
                <mat-option *ngFor="let software of searchOptions" [value]="software">
                    {{software.name}}
                </mat-option>
            </ng-container>

            <mat-option [value]="_NEW_SOFTWARE_">
                Not listed
            </mat-option>
        </mat-autocomplete>
    </mat-form-field>

    <ng-container *ngIf="isNewSoftware$ | async">
        <mat-card>
            <mat-card-header>
                <h3>Request other software</h3>
            </mat-card-header>
            <mat-card-content>
                <lab-software-request-form
                    [name]="_softwareRequest.value.name"
                    [disabled]="searchControl.disabled"
                    (softwareRequestChange)="_softwareRequest.next($event)" />
            </mat-card-content>
        </mat-card>
    </ng-container>
    
    `
})
export class SoftwareSearchComponent implements ControlValueAccessor {
    readonly _NEW_SOFTWARE_ = _NEW_SOFTWARE_;

    readonly softwares = inject(SoftwareModelCollection);
    readonly searchControl = new FormControl<Software | string>('');

    readonly searchOptions$ = defer(() => this.softwares.items$);
    readonly isNewSoftware$ = this.searchControl.valueChanges.pipe(
        map(value => value === _NEW_SOFTWARE_)
    );

    readonly _softwareRequest = new BehaviorSubject<NewSoftwareRequest>({name: '', description: ''});


    readonly value$: Observable<Software | NewSoftwareRequest | null> = defer(
        () => this.searchControl.valueChanges.pipe(
            startWith(this.searchControl.value),
            switchMap(value => {
                if (value === _NEW_SOFTWARE_) {
                    return this._softwareRequest;
                } else if (typeof value === 'string') {
                    return of(null);
                } else {
                    return of(value);
                }
            })
        )
    )

    _onSoftwareRequestChange(request: NewSoftwareRequest) {
        this._softwareRequest.next(request);
    }

    writeValue(obj: any): void {
        if (typeof obj === 'string' || obj == null) {
            this.searchControl.setValue(obj || '');
        }
        if (obj instanceof Software) {
            this.searchControl.setValue(obj);
        } else if (isNewSoftwareRequest(obj)) {
            this.searchControl.setValue(_NEW_SOFTWARE_);
            this._softwareRequest.next({...obj});
        }
    }

    _onChange = (value: any) => { }
    registerOnChange(fn: any) {
        this._onChange = fn;
    }

    _onTouched = () => {}
    registerOnTouched(fn: any) {
        this._onTouched = fn;
    }

    setDisabledState = disabledStateToggler(this.searchControl);

    _displaySearch(newSoftwareName: string) {
        return (search: Software | string) => {
            if (search instanceof Software) {
                return search.name;
            } else if (search === _NEW_SOFTWARE_) {
                return '(new) ' + newSoftwareName;
            } else {
                return search;
            }

        }
    }



}