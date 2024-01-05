import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/uni/research/funding/cost-estimate/cost-estimate';

/**
 * An equipment request
 */
export interface EquipmentRequest {
  readonly name: string;
  readonly reason: string;

  readonly cost: CostEstimate | null;
}

export function isEquipmentRequest(obj: any): obj is EquipmentRequest {
  return typeof obj === 'object' && obj != null && typeof obj.name === 'string';
}

export function equipmentRequestToJson(obj: EquipmentRequest): {
  [k: string]: unknown;
} {
  return {
    name: obj.name,
    reason: obj.reason,
    cost: obj.cost && costEstimateToJson(obj.cost),
  };
}

export function equipmentRequestFromJson(json: unknown): EquipmentRequest {
  if (typeof json !== 'object' || json == null) {
    throw new Error('Expected an object');
  }
  const obj: { [k: string]: unknown } = json as { [k: string]: unknown };

  if (typeof obj['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof obj['reason'] !== 'string') {
    throw new Error("Expected a string 'reason'");
  }
  const cost: CostEstimate | null =
    typeof obj['cost'] === 'object' && obj['cost'] != null
      ? costEstimateFromJson(obj['cost'])
      : null;

  return {
    name: obj['name'],
    reason: obj['reason'],
    cost,
  };
}
