import { Component, computed, input } from "@angular/core";
import { Provisionable } from "./provisionable";
import { LabProvision } from "./provision";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { CommonQuantityComponent } from "src/app/common/measurement/common-quantity.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { ProvisionEventInfoComponent } from "./provision-event-info.component";
import { MatListModule } from "@angular/material/list";
import { ResearchPurchaseInfoComponent } from "src/app/research/budget/research-purchase-info.component";
import { ResearchPurchaseOrderInfoComponent } from "src/app/research/budget/research-purchase-order-info.component";


@Component({
    selector: 'lab-provision-info',
    standalone: true,
    imports: [
        MatListModule,

        CommonQuantityComponent,
        ProvisionStatusPipe,
        ProvisionEventInfoComponent,
        ResearchPurchaseOrderInfoComponent
    ],
    template: `
    <span class="provision-action"> {{action()}}</span> Provision
    <span class="provision-status">{{provisionStatus() | provisionStatus}}</span>

    @if (!hideDetails()) {
        <div class="provision-details">
            <div class="target-info">
                <div>Target</div>
                <ng-content select="provisionTargetInfo" />
            </div>

            @if (!hidePurchaseInfo()) {
                <div class="purchase-info">
                    <div>Purchase info</div>
                    <research-purchase-order-info [purchaseOrder]="provision()" />
                </div>
            }


            <!--
            @switch (displayStatusHistory()) {
                @case ('full') {
                <div class="provision-history-info">
                    <div class="section-title">History</div>
                    <div class="content">
                        <mat-list>
                            @for (m of provision().statusMetadataHistory; track m.status) {
                                <mat-list-item>
                                    <lab-provision-status-metadata-info [metadata]="m" />
                                </mat-list-item>
                            }
                        </mat-list>
                    </div>
                </div>
                }

                @case ('only-current') {
                    <div class="provision-current-status-info">
                        <div class="section-title">Last action</div>

                        <div class="content">
                            <lab-provision-info
                                [metadata]="provision().currentStatusMetadata" />
                        </div>
                    </div>
                }
            </div>
            -->
        </div>
    }
    `
})
export class LabProvisionInfoComponent<
    TProvision extends LabProvision<any>
> {
    provision = input.required<TProvision>();
    action = computed(() => this.provision().action);

    hideDetails = input(false, { transform: coerceBooleanProperty });
    hideQuantityInfo = input(false, { transform: coerceBooleanProperty });
    hidePurchaseInfo = input(false, { transform: coerceBooleanProperty });

    provisionType = computed(() => this.provision().type);
    provisionStatus = computed(() => this.provision().status);

    isApproved = computed(() => this.provision().isApproved);
    isPurchased = computed(() => this.provision().isPurchased);
}