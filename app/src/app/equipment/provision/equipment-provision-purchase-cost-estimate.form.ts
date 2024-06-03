import { Component, EventEmitter, Input, Output, inject, input } from "@angular/core";
import { ResearchFundingCostEstimateFormComponent } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { EquipmentProvision } from "./equipment-provision";
import { BehaviorSubject, filter, of, shareReplay, startWith, switchMap, tap } from "rxjs";
import { ResearchFunding, ResearchFundingService } from "src/app/research/funding/research-funding";
import { ResearchFundingSelectComponent } from "src/app/research/funding/research-funding-select.component";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { toObservable } from "@angular/core/rxjs-interop";


@Component({
    selector: 'equipment-provision-purchase-cost-estimate-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        ResearchFundingCostEstimateFormComponent,
        ResearchFundingSelectComponent
    ],
    template: `
    <research-funding-select 
        [formControl]="researchFundingControl">
        <mat-label>Funding</mat-label>
    </research-funding-select>

    @if (funding$ | async; as funding) {
        <research-funding-cost-estimate-form
            name="equipment purchase"
            [funding]="funding" 
            [quantityRequired]="provision().quantityRequired" 
        />
    }
    `
})
export class EquipmentProvisionPurchaseCostEstimateForm {
    readonly _researchFundingService = inject(ResearchFundingService);
    readonly researchFundingControl = new FormControl<ResearchFunding | null>(null);

    provision = input.required<EquipmentProvision>();

    @Output()
    save = new EventEmitter<EquipmentProvision>();

    readonly funding$ = toObservable(this.provision).pipe(
        switchMap(provision => provision.resolveFunding(this._researchFundingService)),
        tap(funding => {
            this.researchFundingControl.setValue(funding);
        }),
        switchMap(funding => this.researchFundingControl.valueChanges.pipe(
            startWith(funding)
        )),
        shareReplay(1)
    );
}