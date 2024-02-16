import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { LabProfilePage } from "../../_features/lab-profile.page";
import { ResearchFunding, ResearchFundingService } from "src/app/research/funding/research-funding";
import { Observable, filter, map, of, shareReplay } from "rxjs";
import { NewEquipmentRequestFormComponent } from "../../../equipment/provision/provision-new-equipment-form.component";
import { Lab } from "../../lab";
import { injectMaybeLabFromContext } from "../../lab-context";

@Component({
    selector: 'lab-equipment-request-page',
    standalone: true,
    imports: [
        CommonModule,
        NewEquipmentRequestFormComponent
    ],
    template: `
    <h1>Request new equipment</h1>
    @if (funding$ | async; as funding) {
        @if (lab$ | async; as lab) {
            <equipment-provision-new-equipment-form
                [lab]="lab"
                [funding]="funding" />
        }
    }
    `
})
export class EquipmentRequestPage {
    readonly fundings = inject(ResearchFundingService);
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

    readonly lab$: Observable<Lab | null> = injectMaybeLabFromContext();
}