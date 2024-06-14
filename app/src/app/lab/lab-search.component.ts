import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, effect, inject, input, model } from "@angular/core";
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable } from "rxjs";
import { Lab, LabService } from "./lab";
import { Discipline, formatDiscipline } from "../uni/discipline/discipline";
import { Campus } from "../uni/campus/campus";
import { HttpParams } from "@angular/common/http";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { ModelSearchInputComponent } from "../common/model/search/search-input-field.component";
import { ModelSearchComponent, ModelSearchControl, NotFoundValue, provideModelSearchValueAccessor } from "../common/model/search/search-control";
import { ModelSearchAutocompleteComponent } from "../common/model/search/search-autocomplete.component";
import { ModelRef } from "../common/model/model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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

        <common-model-search-autocomplete [notFoundTemplate]="notFoundTemplate()" />

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

    value = model<Lab | NotFoundValue | undefined>();

    constructor() {
        this.searchControl.value$.pipe(
            takeUntilDestroyed()
        ).subscribe(value => this.value.set(value));
        effect(() => {
            const lab = this.value();
            if (lab instanceof NotFoundValue && lab.searchInput !== this.searchControl.searchInput) {
                this.searchControl.setSearchInput(lab.searchInput);
            }
            if (lab instanceof Lab) {
                this.searchControl.writeValue(lab);
            }
        });
    }

    campus = input<ModelRef<Campus> | ModelRef<Campus>[]>();
    discipline = input<Discipline | Discipline[]>([]);

    notFoundTemplate = input<TemplateRef<unknown>>();
    allowNotFound = input(false, { transform: coerceBooleanProperty });

    getModelOptions(search: string): Observable<Lab[]> {
        return this.labs.query({
            campus: this.campus(),
            discipline: this.discipline(),
            search
        });
    }

    _displayLab(lab: Lab) {
        const discipline = formatDiscipline(lab.discipline);
        return ` ${lab.campus.name} - ${discipline}`
    }
}