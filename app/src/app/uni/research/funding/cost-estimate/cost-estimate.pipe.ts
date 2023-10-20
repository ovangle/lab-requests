import { LOCALE_ID, Pipe, PipeTransform, inject } from "@angular/core";
import { CostEstimate, formatCostEstimate } from "./cost-estimate";

@Pipe({
    name: 'uniCostEstimate',
    standalone: true
})
export class CostEstimatePipe implements PipeTransform {
    readonly locale = inject(LOCALE_ID);

    transform(costEstimate: CostEstimate | null, format: 'total' | 'full' = 'full', ...args: any[]): string {
        if (costEstimate == null) {
            return 'unknown';
        }
        return formatCostEstimate(costEstimate, format, this.locale);
    }
}