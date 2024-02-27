import { formatCurrency } from '@angular/common';
import {
  UnitOfMeasurement,
  formatUnitOfMeasurement,
} from 'src/app/common/measurement/measurement';
import { ResearchFunding } from '../research-funding';

export interface CostEstimate {
  funding: ResearchFunding;
  isUniversitySupplied: boolean;
  perUnitCost: number;
  unit: UnitOfMeasurement;
  quantityRequired: number;
}

export function costEstimateTotal(estimate: CostEstimate): number {
  return estimate.quantityRequired * estimate.perUnitCost;
}

export function isCostEstimate(obj: unknown): obj is CostEstimate {
  return (
    typeof obj === 'object' &&
    obj != null &&
    typeof (obj as any).isUniversitySupplied === 'boolean' &&
    typeof (obj as any).estimatedCost === 'number'
  );
}

/**
 * Formats a cost estimate
 *
 * @param costEstimate
 * The cost estimate to format
 * @param format
 * The following formats are accepted:
 * - 'full'
 *      e.g. $40.00 (4 @ $10.00 per item)
 * - 'total-only'
 *      e.g. $40.00
 * @param locale
 * A locale code.
 */
export function formatCostEstimate(
  costEstimate: CostEstimate,
  format: 'total' | 'full',
  locale: string,
): string {
  const totalCost = formatCurrency(
    costEstimateTotal(costEstimate),
    locale,
    '$',
  );
  if (format === 'total') {
    return totalCost;
  }
  const perUnitCost = formatCurrency(costEstimate.perUnitCost, locale, '$');
  const unitOfMeasurement = formatUnitOfMeasurement(
    costEstimate.unit,
    costEstimate.quantityRequired,
    locale,
  );
  if (format === 'full') {
    return `${totalCost} (${costEstimate.quantityRequired} @ ${perUnitCost} per ${unitOfMeasurement})`;
  }
  throw new Error('Invalid format ${format}');
}
