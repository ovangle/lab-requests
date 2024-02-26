import { Component, Input, inject } from "@angular/core";
import { ResearchFundingCostEstimateFormComponent } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { EquipmentProvision } from "./equipment-provision";
import { BehaviorSubject, filter, shareReplay, switchMap } from "rxjs";
import { ResearchFundingService } from "src/app/research/funding/research-funding";
import { ResearchFundingSelectComponent } from "src/app/research/funding/research-funding-select.component";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'equipment-provision-purhcase-cost-estimate-form',
    standalone: true,
    imports: [
        CommonModule,
        ResearchFundingCostEstimateFormComponent,
        ResearchFundingSelectComponent
    ],
    template: `
    <research-funding-cost-estimate-form
        name="equipment purchase"
        [form]="costEstimateForm"
        [funding]="provision.funding" 
        [quantityRequired]="provision.quantityRequired || 0" 
        [unitOfMeasurement]="item" />
    `
})
export class EquipmentProvisionCostEstimateForm {
    readonly _researchFundingService = inject(ResearchFundingService);
    readonly provisionSubject = new BehaviorSubject<EquipmentProvision | null>(null);

    @Input({ required: true })
    set provision(provision: EquipmentProvision) {
        this.provisionSubject.next(provision);
    }

    readonly provision$ = this.provisionSubject.pipe(
        filter((p): p is EquipmentProvision => p != null)
    )

    readonly funding$ = this.provision$.pipe(
        switchMap(provision => provision.resolveFunding(this._researchFundingService)),
        shareReplay(1)
    )

    ngOnDestroy() {
        this.provisionSubject.complete();
    }

}