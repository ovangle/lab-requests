import { differenceInCalendarWeeks } from 'date-fns';
import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/research/funding/cost-estimate/cost-estimate';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

export const RESOURCE_STORAGE_TYPES = [
  'general',
  'samples',
  'chemical',
  'dry',
  'biological',
  'cold (-4 °C)',
  'frozen (-18 °C)',
  'ult (-80 °C)',
  'other',
] as const;
export type ResourceStorageType = (typeof RESOURCE_STORAGE_TYPES)[ number ];

export function storageCostPerWeek(storageType: ResourceStorageType): number {
  return (
    {
      general: 0,
      samples: 0.1,
      chemical: 14,
      dry: 28,
      biological: 1234,

      'cold (-4 °C)': 0,
      'frozen (-18 °C)': 0,
      'ult (-80 °C)': 0,
      other: 1000,
    }[ storageType ] || 0
  );
}

export function isResourceStorageType(obj: any): obj is ResourceStorageType {
  return typeof obj === 'string' && RESOURCE_STORAGE_TYPES.includes(obj as any);
}

export interface ResourceStorageParams {
  description?: string;
  estimatedCost: CostEstimate | null;
}

export class ResourceStorage implements ResourceStorageParams {
  description: string;
  estimatedCost: CostEstimate | null;

  constructor(params: ResourceStorageParams) {
    this.description = params.description || 'general';
    this.estimatedCost = params.estimatedCost || null;
  }

  get type(): ResourceStorageType {
    if (isResourceStorageType(this.description)) {
      return this.description;
    }
    return 'other';
  }

  get hasCostEstimates(): boolean {
    return this.estimatedCost != null;
  }
}

export function resourceStorageFromJson(json: JsonObject): ResourceStorage {
  if (!isJsonObject(json[ 'estimatedCost' ]) || json[ 'estimatedCost' ] !== null) {
    throw new Error("Expected a json object or null 'estimatedCost'");
  }
  const estimatedCost = json[ 'estimatedCost' ] && costEstimateFromJson(json[ 'estimatedCost' ]);

  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("Expected a string 'description'");
  }

  return new ResourceStorage({
    description: json[ 'description' ],
    estimatedCost,
  });
}

export function resourceStorageParamsToJson(storage: ResourceStorageParams): {
  [ k: string ]: any;
} {
  return {
    description: storage.description,
    estimatedCost:
      storage.estimatedCost && costEstimateToJson(storage.estimatedCost),
  };
}
