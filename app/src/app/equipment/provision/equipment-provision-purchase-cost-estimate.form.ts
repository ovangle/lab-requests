import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { ResearchFundingCostEstimateFormComponent, costEstimateForm } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { EquipmentProvision } from "./equipment-provision";
import { BehaviorSubject, filter, of, shareReplay, startWith, switchMap, tap } from "rxjs";
import { ResearchFunding, ResearchFundingService } from "src/app/research/funding/research-funding";
import { ResearchFundingSelectComponent } from "src/app/research/funding/research-funding-select.component";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";


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
            [quantityRequired]="provision.quantityRequired || 0" 
            unitOfMeasurement="item" />
    }
    `
})
export class EquipmentProvisionPurchaseCostEstimateForm {
    readonly _researchFundingService = inject(ResearchFundingService);
    readonly researchFundingControl = new FormControl<ResearchFunding | null>(null);
    readonly provisionSubject = new BehaviorSubject<EquipmentProvision | null>(null);

    @Input({ required: true })
    get provision() {
        return this.provisionSubject.value!;
    }
    set provision(provision: EquipmentProvision) {
        this.provisionSubject.next(provision);
    }

    @Output()
    save = new EventEmitter<EquipmentProvision>();

    readonly provision$ = this.provisionSubject.pipe(
        filter((p): p is EquipmentProvision => p != null)
    )

    readonly funding$ = this.provision$.pipe(
        switchMap(provision => provision.resolveFunding(this._researchFundingService)),
        tap(funding => {
            this.researchFundingControl.setValue(funding);
        }),
        switchMap(funding => this.researchFundingControl.valueChanges.pipe(
            startWith(funding)
        )),
        shareReplay(1)
    )

    ngOnDestroy() {
        this.provisionSubject.complete();
    }

}