import { Component, computed, input } from "@angular/core";
import { Provisionable } from "./provisionable";
import { LabProvision } from "./provision";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { ResearchFundingCostEstimateComponent } from "src/app/research/funding/cost-estimate/cost-estimate.component";
import { CommonQuantityComponent } from "src/app/common/measurement/common-quantity.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { ProvisionStatusMetadataInfoComponent } from "./provision-status-metadata-info.component";
import { MatListModule } from "@angular/material/list";


@Component({
    selector: 'lab-provision-info',
    standalone: true,
    imports: [
        MatListModule,

        CommonQuantityComponent,
        ProvisionStatusPipe,
        ResearchFundingCostEstimateComponent,
        ProvisionStatusMetadataInfoComponent
    ],
    template: `
    Provision 
    <span class="provision-type"><ng-content select="provisionTypeInfo" /></span>
    <span class="provision-status">{{provisionStatus() | provisionStatus}}</span>

    <div class="provision-details">
        <div class="target-info">
            <div>Target</div>
            <ng-content select="provisionTargetInfo" />
        </div>

        @if (!hideQuantityInfo()) {
            <div class="quantity-info">
                <div>Quantity required</div>
                <common-quantity [quantity]="provision().quantityRequired" />
            </div>
        }

        <div class="cost-info">
            <div>Costs</div>
            @if (estimatedCost(); as cost) {
                <research-funding-cost-estimate [cost]="cost" />

                @if (purchaseCost(); as purchaseCost) {
                    <research-funding-cost-estimate [cost]="purchaseCost" />
                } @else {
                    <p>Not (yet) purchased</p>
                }
            } @else {
                <p>No direct cost</p>
            }
        </div>

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
                        <lab-provision-status-metadata-info 
                            [metadata]="provision().currentStatusMetadata" />
                    </div>
                </div>
            }
        }
    </div>
    `
})
export class LabProvisionInfoComponent<
    TProvision extends LabProvision<any>
> {
    provision = input.required<TProvision>();

    hideQuantityInfo = input(false, {
        transform: coerceBooleanProperty
    });

    displayStatusHistory = input<'full' | 'only-current' | null>('full');

    provisionType = computed(() => this.provision().type);
    provisionStatus = computed(() => this.provision().status);

    estimatedCost = computed(() => this.provision().estimatedCost);
    purchaseCost = computed(() => this.provision().purchaseCost);

    isApproved = computed(() => this.provision().isApproved);
    isPurchased = computed(() => this.provision().isPurchased);
    isInstalled = computed(() => this.provision().isInstalled);
}