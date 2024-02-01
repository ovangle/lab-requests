import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { LabProfilePage } from "../../_features/lab-profile.page";
import { ResearchFunding, injectResearchFundingService } from "src/app/research/funding/research-funding";
import { Observable, filter, of, shareReplay } from "rxjs";
import { EquipmentProvisioiningRequestFormComponent } from "../provision/equipment-provisioning-request-form.component";
import { Lab } from "../../lab";

@Component({
    selector: 'lab-equipment-request-page',
    standalone: true,
    imports: [
        CommonModule,
        EquipmentProvisioiningRequestFormComponent
    ],
    template: `
    @if (funding$ | async; as funding) {
        <lab-equipment-provision-request-form
            [lab]="lab$ | async"
            [funding]="funding" />
    }
    `
})
export class EquipmentRequestPage {
    readonly fundings = injectResearchFundingService();
    /* TODO: There should be a funding type 'lab_budget' or sumthin */
    readonly funding$ = this.fundings.queryOne({ 'name': 'Grant' }).pipe(
        filter((f): f is ResearchFunding => {
            if (f == null) {
                throw new Error('Could not locate research funding with name `grant`');
            }
            return true;
        }),
        shareReplay(1)
    );

    readonly labProfile = inject(LabProfilePage, { optional: true });
    readonly lab$: Observable<Lab | null> = this.labProfile ? this.labProfile.lab$ : of(null);
}