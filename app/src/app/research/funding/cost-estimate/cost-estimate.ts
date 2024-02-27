import { formatCurrency } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  UnitOfMeasurement,
  formatUnitOfMeasurement,
  isUnitOfMeasurement,
} from 'src/app/common/measurement/measurement';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ResearchFunding, researchFundingFromJsonObject } from '../research-funding';

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

export function costEstimateFromJson(json: JsonObject): CostEstimate {
  if (!isJsonObject(json[ 'funding' ])) {
    throw new Error("expected a json object or null 'funding'");
  }
  const funding = researchFundingFromJsonObject(json[ 'funding' ]);

  if (typeof json[ 'isUniversitySupplied' ] !== 'boolean') {
    throw new Error("expected a boolean 'isUniversitySupplied'");
  }
  if (typeof json[ 'estimatedCost' ] !== 'number') {
    throw new Error("Expected a number 'estimatedCost'");
  }
  const unit = isUnitOfMeasurement(json[ 'unit' ]) ? json[ 'unit' ] : 'item';
  const quantityRequired =
    typeof json[ 'quantityRequired' ] === 'number' ? json[ 'quantityRequired' ] : 1;

  return {
    funding,
    isUniversitySupplied: json[ 'isUniversitySupplied' ],
    perUnitCost: json[ 'estimatedCost' ],
    unit,
    quantityRequired,
  };
}

export function costEstimateToJson(cost: CostEstimate) {
  let result: { [ k: string ]: any } = {
    isUniversitySupplied: cost.isUniversitySupplied,
    estimatedCost: cost.perUnitCost,
    unit: cost.unit,
    quantityRequired: cost.quantityRequired,
  };
  return result;
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
