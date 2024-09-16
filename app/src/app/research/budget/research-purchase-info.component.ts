import { Component, input } from "@angular/core";
import { ResearchPurchase } from "./research-budget";

@Component({
    selector: 'research-purchase-info',
    standalone: true,
    imports: [],
    template: `
    `
})
export class ResearchPurchaseInfoComponent {
    purchase = input.required<ResearchPurchase>();
}