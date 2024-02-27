import { ThisReceiver } from '@angular/compiler';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JsonObject } from 'src/app/utils/is-json-object';

export const RESOURCE_DISPOSAL_TYPES = [
  'general',
  'bulk/landfill',
  'recyclable',
  'liquids/oil',
  'hazardous',
  'other',
] as const;

export type ResourceDisposalType = (typeof RESOURCE_DISPOSAL_TYPES)[ number ];

export function isResourceDisposalType(obj: any): obj is ResourceDisposalType {
  return (
    typeof obj === 'string' && RESOURCE_DISPOSAL_TYPES.includes(obj as never)
  );
}

export interface ResourceDisposalParams {
  readonly description: string;
  readonly estimatedCost: number | null;
}

export class ResourceDisposal {
  readonly description: string;
  readonly estimatedCost: number | null;

  constructor(params: ResourceDisposalParams) {
    this.description = params.description;
    this.estimatedCost = params.estimatedCost || null;
  }

  get type(): ResourceDisposalType {
    if (isResourceDisposalType(this.description)) {
      return this.description;
    }
    return 'other';
  }
}

export function resourceDisposalFromJson(json: JsonObject): ResourceDisposal {
  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  if (typeof json[ 'estimatedCost' ] !== 'number' && json[ 'estimatedCost' ] !== null) {
    throw new Error("Expected a number or null 'estimatedCost'");
  }


  return new ResourceDisposal({
    description: json[ 'description' ],
    estimatedCost: json[ 'estimatedCost' ]
  });
}

export function resourceDisposalParamsToJson(
  disposal: ResourceDisposalParams,
): { [ k: string ]: any } {
  return {
    description: disposal.description,
    costEstimate: disposal.estimatedCost,
  };
}
