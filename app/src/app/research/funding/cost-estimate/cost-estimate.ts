import { formatCurrency } from '@angular/common';
import {
  UnitOfMeasurement,
  formatUnitOfMeasurement,
  isUnitOfMeasurement,
} from 'src/app/common/measurement/measurement';
import { ResearchFunding, researchFundingFromJsonObject } from '../research-funding';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelRef, isModelRef, modelId, modelRefJsonDecoder } from 'src/app/common/model/model';
import { firstValueFrom } from 'rxjs';
import { ModelService } from 'src/app/common/model/model-service';

export interface CostEstimate {
  funding: ModelRef<ResearchFunding>;

  perUnitCost: number;
  unit: UnitOfMeasurement;
  numRequired: number;

  refUrl?: string;
}

export function costEstimateTotal(estimate: CostEstimate): [number, UnitOfMeasurement] {
  return [
    estimate.numRequired * estimate.perUnitCost,
    estimate.unit
  ];
}

export async function costEstimateFunding(estimate: CostEstimate, service: ModelService<ResearchFunding>) {
  if (typeof estimate.funding === 'string') {
    estimate.funding = await firstValueFrom(service.fetch(estimate.funding))
  }
  return estimate.funding;
}

export function isCostEstimate(obj: unknown): obj is CostEstimate {
  return (
    typeof obj === 'object' &&
    obj != null &&
    isModelRef((obj as any).funding) &&
    isUnitOfMeasurement((obj as any).unit)
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
    costEstimateTotal(costEstimate)[0],
    locale,
    '$',
  );
  if (format === 'total') {
    return totalCost;
  }
  const perUnitCost = formatCurrency(costEstimate.perUnitCost, locale, '$');
  const unitOfMeasurement = formatUnitOfMeasurement(
    costEstimate.unit,
    costEstimate.numRequired,
    locale,
  );
  if (format === 'full') {
    return `${totalCost} (${costEstimate.numRequired} @ ${perUnitCost} per ${unitOfMeasurement})`;
  }
  throw new Error('Invalid format ${format}');
}

export function costEstimateToJsonObject(estimate: CostEstimate): JsonObject {
  return {
    funding: modelId(estimate)
  };
}


export function costEstimateFromJsonObject(json: JsonObject): CostEstimate;
export function costEstimateFromJsonObject(json: JsonObject | null): CostEstimate | null;

export function costEstimateFromJsonObject(json: JsonObject | null): CostEstimate | null {
  if (json == null) {
    return null;
  }

  const funding = modelRefJsonDecoder(
    'funding',
    researchFundingFromJsonObject,
  )(json);
  if (typeof json['perUnitCost'] !== 'number') {
    throw new Error("Expected a number 'per unit' cost");
  }
  if (!isUnitOfMeasurement(json['unit'])) {
    throw new Error("Expected a unit of measurment 'unit'");
  }
  if (typeof json['numRequired'] !== 'number') {
    throw new Error("Expected a number 'numRequired'")
  }

  return {
    funding,
    perUnitCost: json['perUnitCost'],
    unit: json['unit'],
    numRequired: json['numRequired']
  };
}