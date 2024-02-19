import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, inject } from "@angular/core";
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable } from "rxjs";
import { Lab, LabService } from "./lab";
import { Discipline, formatDiscipline } from "../uni/discipline/discipline";
import { Campus } from "../uni/campus/campus";
import { HttpParams } from "@angular/common/http";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { ModelSearchInputComponent } from "../common/model/search/search-input-field.component";
import { ModelSearchComponent, ModelSearchControl, provideModelSearchValueAccessor } from "../common/model/search/search-control";
import { ModelSearchAutocompleteComponent } from "../common/model/search/search-autocomplete.component";

@Component({
    selector: 'lab-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,

        ModelSearchInputComponent,
        ModelSearchAutocompleteComponent
    ],
    template: `
    <common-model-search-input-field [search]="searchControl">
        <mat-label>
            <ng-content select="mat-label"></ng-content>
        </mat-label>

        <common-model-search-autocomplete [notFoundTemplate]="notFoundTemplate" />

        <mat-error>
            <ng-content select="mat-error" />
        </mat-error>
    </common-model-search-input-field>
    `,
    providers: [
        provideModelSearchValueAccessor(LabSearchComponent)
    ]
})
export class LabSearchComponent implements ModelSearchComponent<Lab> {
    readonly labs = inject(LabService);

    readonly searchControl = new ModelSearchControl(
        (search: string) => this.getModelOptions(search),
        (lab) => this._displayLab(lab)
    );

    @Input()
    campus: Campus | undefined;

    @Input()
    discipline: Discipline | undefined;

    @Input()
    notFoundTemplate: TemplateRef<unknown> | undefined;

    @Input()
    get allowNotFound(): boolean {
        return this._allowNotFound;
    }
    set allowNotFound(value: BooleanInput) {
        this._allowNotFound = coerceBooleanProperty(value);
    }
    _allowNotFound = false;

    getModelOptions(searchValue: string): Observable<Lab[]> {
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

    _displayLab(lab: Lab) {
        const discipline = formatDiscipline(lab.discipline);
        return ` ${lab.campus.name} - ${discipline}`
    }
}