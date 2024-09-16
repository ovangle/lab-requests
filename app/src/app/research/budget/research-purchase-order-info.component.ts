import { Component, input } from "@angular/core";
import { ResearchPurchaseOrder } from "./research-budget";
import { ResearchPurchaseInfoComponent } from "./research-purchase-info.component";

@Component({
    selector: 'research-purchase-order-info',
    standalone: true,
    imports: [
        ResearchPurchaseInfoComponent
    ],
    template: `
    `
})
export class ResearchPurchaseOrderInfoComponent {
    purchaseOrder = input.required<ResearchPurchaseOrder>();
}