import { Injectable, inject, ɵɵi18nApply } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subscription, defer, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { ALL_RESOURCE_TYPES, ResourceType } from '../lab-resource/resource-type';

import type { Resource, ResourceParams } from '../lab-resource/resource';
import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  EquipmentLease,
  equipmentLeaseFromJson,
} from '../lab-resource/types/equipment-lease/equipment-lease';
import {
  InputMaterial,
  inputMaterialFromJson,
} from '../lab-resource/types/input-material/input-material';
import {
  OutputMaterial,
  outputMaterialFromJson,
} from '../lab-resource/types/output-material/output-material';
import { SoftwareLease, softwareLeaseFromJsonObject, softwareLeasePatchToJsonObject } from '../lab-resource/types/software-lease/software-lease';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ResearchFunding, ResearchFundingService, researchFundingFromJsonObject } from 'src/app/research/funding/research-funding';
import { Lab, LabService } from '../lab';
import { ModelContext } from 'src/app/common/model/context';

export interface ResourceContainerParams extends ModelParams {
  equipments: EquipmentLease[];
  softwares: SoftwareLease[];

  inputMaterials: InputMaterial[];
  outputMaterials: OutputMaterial[];
}

export abstract class ResourceContainer extends Model implements ResourceContainerParams {
  abstract funding: ResearchFunding;
  abstract lab: Lab | string;

  equipments: EquipmentLease[];
  softwares: SoftwareLease[];

  inputMaterials: InputMaterial[];
  outputMaterials: OutputMaterial[];

  constructor(params: ResourceContainerParams) {
    super(params);

    this.equipments = params.equipments;
    this.softwares = params.softwares;
    this.inputMaterials = params.inputMaterials;
    this.outputMaterials = params.outputMaterials;
  }

  async resolveLab(labService: LabService): Promise<Lab> {
    if (typeof this.lab === 'string') {
      this.lab = await firstValueFrom(labService.fetch(this.lab));
    }
    return this.lab;
  }


  getResources<T extends Resource>(t: ResourceType & T[ 'type' ]): readonly T[] {
    return this[ resourceContainerAttr(t) ] as any[];
  }

  countResources(t: ResourceType): number {
    return this.getResources(t).length;
  }

  getResourceAt<T extends Resource>(
    t: ResourceType & T[ 'type' ],
    index: number,
  ): T {
    const resources = this.getResources(t);
    if (index < 0 || index >= resources.length) {
      throw new Error(`No resource at ${index}`);
    }
    return resources[ index ];
  }

}


export function resourceContainerAttr(
  type: ResourceType,
): keyof ResourceContainer {
  switch (type) {
    case 'equipment-lease':
      return 'equipments';
    case 'software-lease':
      return 'softwares';
    case 'input-material':
      return 'inputMaterials';
    case 'output-material':
      return 'outputMaterials'
  }
}

export function resourceContainerParamsFromJson(json: JsonObject): ResourceContainerParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (!Array.isArray(json[ 'equipments' ]) || !json[ 'equipments' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'equipments'")
  }
  const equipments = json[ 'equipments' ].map(equipmentLeaseFromJson);

  if (!Array.isArray(json[ 'softwares' ]) || !json[ 'softwares' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'softwares'")
  }
  const softwares = json[ 'softwares' ].map(softwareLeaseFromJsonObject);

  if (!Array.isArray(json[ 'inputMaterials' ]) || !json[ 'inputMaterials' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'inputMaterials'")
  }
  const inputMaterials = json[ 'inputMaterials' ].map(inputMaterialFromJson);

  if (!Array.isArray(json[ 'outputMaterials' ]) || !json[ 'outputMaterials' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'outputMaterials'")
  }
  const outputMaterials = json[ 'outputMaterials' ].map(outputMaterialFromJson);


  return {
    ...baseParams,
    equipments,
    softwares,

    inputMaterials,
    outputMaterials
  };
}

@Injectable({ providedIn: 'root' })
export class ResourceContainerContext<T extends ResourceContainer> {
  readonly _labService = inject(LabService);

  _context: ModelContext<T> | undefined;

  _committedSubject = new ReplaySubject<ResourceContainer>(1);
  committed$ = this._committedSubject.asObservable();

  readonly lab$ = this.committed$.pipe(
    switchMap(committed => committed.resolveLab(this._labService))
  )

  readonly fundingService = inject(ResearchFundingService);
  _fundingSubject = new ReplaySubject<ResearchFunding | string>(1);
  funding$ = this._fundingSubject.pipe(
    switchMap(funding => {
      if (typeof funding === 'string') {
        return this.fundingService.fetch(funding)
      }
      return of(funding);
    }),
    shareReplay(1)
  )


  get context(): ModelContext<T> {
    if (this._context === undefined) {
      throw new Error('No current control')
    }
    return this._context;
  }

  get url$(): Observable<string> {
    return this.context.url$;
  }

  attachContext(context: ModelContext<T>): Subscription {
    if (this._context !== undefined) {
      throw new Error('Can only associate at most one model context');
    }
    this._context = context;

    const syncCommitted = context.committed$.subscribe(
      committed => this._committedSubject.next(committed)
    );
    return new Subscription(() => {
      syncCommitted.unsubscribe();
      this._context = undefined;
    });
  }

  committedResources$<TResource extends Resource>(
    resourceType: ResourceType,
  ): Observable<readonly TResource[]> {
    return this.committed$.pipe(
      map((committed) =>
        committed ? committed.getResources<TResource>(resourceType) : [],
      ),
    );
  }

  async getResourceAt<T extends Resource>(resourceType: T[ 'type' ], index: number): Promise<T | undefined> {
    const committed = await firstValueFrom(this.committed$);
    return committed.getResourceAt(resourceType, index);
  }

  async getResourceCount(resourceType: ResourceType): Promise<number> {
    const committed = await firstValueFrom(this.committed$);
    return committed.getResources(resourceType).length;
  }


  refresh() {
    return this.context.refresh();
  }
}

