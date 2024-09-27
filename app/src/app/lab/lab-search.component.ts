import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, computed, effect, inject, input, model } from "@angular/core";
import { AbstractControlDirective, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
import { combineLatest, map, Observable } from "rxjs";
import { Lab, LabService } from "./lab";
import { Discipline, formatDiscipline, isDiscipline } from "../uni/discipline/discipline";
import { Campus } from "../uni/campus/campus";
import { HttpParams } from "@angular/common/http";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { ModelSearchInputComponent } from "../common/model/search/search-input.component";
import { ModelSearchComponent, ModelSearchControl, NotFoundValue } from "../common/model/search/search-control";
import { ModelSearchAutocompleteComponent } from "../common/model/search/search-autocomplete.component";
import { modelId, ModelRef } from "../common/model/model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

let _currentId = 0;
function _nextControlId() {
    return _currentId++;
}

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
    <common-model-search-input [searchControl]="searchControl" [modelSearchAutocomplete]="modelSearchAutocomplete"/>
    <common-model-search-autocomplete
        #modelSearchAutocomplete
        [searchControl]="searchControl"
        [notFoundTemplate]="notFoundTemplate()"
        [disabledOptions]="disabledLabs()" />
    `,
    providers: [
        { provide: MatFormFieldControl, useExisting: LabSearchComponent },
    ]
})
export class LabSearchComponent extends ModelSearchComponent<Lab> {
    override readonly controlType = 'lab-search';
    override readonly id = `${this.controlType}-${_nextControlId()}`;

    readonly labs = inject(LabService);

    constructor() {
        const searchControl = new ModelSearchControl(
            (search: string) => this.getModelOptions(search),
            (lab) => {
                if (lab instanceof NotFoundValue) {
                    return `not found: ${lab.searchInput}`
                }
                return this._displayLab(lab)
            }
        );
        super(searchControl);
    }

    campus = input<ModelRef<Campus> | ModelRef<Campus>[]>();
    discipline = input<Discipline | Discipline[] | 'any'>();

    // Omit options from the returned query set because they cannot be selected
    disabledLabs = input<ModelRef<Lab>[]>([]);

    notFoundTemplate = input<TemplateRef<unknown>>();
    allowNotFound = input(false, { transform: coerceBooleanProperty });

    getModelOptions(search: string): Observable<Lab[]> {
        const d = this.discipline();
        return this.labs.query({
            campus: this.campus(),
            discipline: Array.isArray(d) || isDiscipline(d) ? d : undefined,
            search
        });
    }

    _displayLab(lab: Lab) {
        const discipline = formatDiscipline(lab.discipline);
        return ` ${lab.campus.name} - ${discipline}`
    }
}