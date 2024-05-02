import { DestroyRef, Injectable, Provider, inject, ɵɵi18nApply } from '@angular/core';
import { BehaviorSubject, NEVER, Observable, ReplaySubject, Subscription, combineLatest, defer, filter, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { ALL_RESOURCE_TYPES, ResourceType, isResourceType } from '../lab-resource/resource-type';

import type { Resource, ResourceParams, ResourcePatch } from '../lab-resource/resource';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelQuery,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  EquipmentLease,
  EquipmentLeasePatch,
  equipmentLeaseFromJson,
  equipmentLeasePatchToJsonObject,
} from '../lab-resource/types/equipment-lease/equipment-lease';
import {
  InputMaterial,
  InputMaterialPatch,
  inputMaterialFromJson,
  inputMaterialPatchToJsonObject,
} from '../lab-resource/types/input-material/input-material';
import {
  OutputMaterial,
  OutputMaterialPatch,
  outputMaterialFromJson,
  outputMaterialPatchToJsonObject,
} from '../lab-resource/types/output-material/output-material';
import { SoftwareLease, SoftwareLeasePatch, softwareLeaseFromJsonObject, softwareLeasePatchToJsonObject } from '../lab-resource/types/software-lease/software-lease';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ResearchFunding, ResearchFundingService, researchFundingFromJsonObject } from 'src/app/research/funding/research-funding';
import { Lab, LabService } from '../lab';
import { ModelContext, ReadOnlyModelContext } from 'src/app/common/model/context';
import { ModelService } from 'src/app/common/model/model-service';
import { ActivatedRoute } from '@angular/router';

export interface ResourceConsumerParams extends ModelParams {

  equipmentLeases: ModelIndexPage<EquipmentLease>;
  softwareLeases: ModelIndexPage<SoftwareLease>;

  inputMaterials: ModelIndexPage<InputMaterial>;
  outputMaterials: ModelIndexPage<OutputMaterial>;
}

export function resourceContainerParamsFromJson(json: JsonObject): ResourceConsumerParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (!isJsonObject(json[ 'equipmentLeases' ])) {
    throw new Error('Expected a page of equipments leases');
  }
  const equipmentLeases = modelIndexPageFromJsonObject(equipmentLeaseFromJson, json[ 'equipmentLeases' ]);

  if (!isJsonObject(json[ 'softwareLeases' ])) {
    throw new Error("Expected a page of json objects 'softwareLeases'")
  }
  const softwareLeases = modelIndexPageFromJsonObject(softwareLeaseFromJsonObject, json[ 'softwareLeases' ]);

  if (!isJsonObject(json[ 'inputMaterials' ])) {
    throw new Error("Expected a page of json objects 'softwareLeases'")
  }
  const inputMaterials = modelIndexPageFromJsonObject(inputMaterialFromJson, json[ 'inputMaterials' ]);

  if (!isJsonObject(json[ 'outputMaterials' ])) {
    throw new Error("Expected a page of json objects 'softwareLeases'")
  }
  const outputMaterials = modelIndexPageFromJsonObject(outputMaterialFromJson, json[ 'outputMaterials' ]);

  return {
    ...baseParams,
    equipmentLeases,
    softwareLeases,

    inputMaterials,
    outputMaterials
  };
}

export abstract class LabResourceConsumer extends Model implements ResourceConsumerParams {
  abstract funding: ResearchFunding | string;
  abstract lab: Lab | string;

  equipmentLeases: ModelIndexPage<EquipmentLease>;
  softwareLeases: ModelIndexPage<SoftwareLease>;

  inputMaterials: ModelIndexPage<InputMaterial>;
  outputMaterials: ModelIndexPage<OutputMaterial>;

  static consumerAttr(type: ResourceType): keyof ResourceConsumerParams {
    switch (type) {
      case 'equipment_lease':
        return 'equipmentLeases';
      case 'software_lease':
        return 'softwareLeases';
      case 'input_material':
        return 'inputMaterials';
      case 'output_material':
        return 'outputMaterials';
    }
  }

  constructor(params: ResourceConsumerParams) {
    super(params);

    this.equipmentLeases = params.equipmentLeases;
    this.softwareLeases = params.softwareLeases;
    this.inputMaterials = params.inputMaterials;
    this.outputMaterials = params.outputMaterials;
  }

  async resolveLab(labService: LabService): Promise<Lab> {
    if (typeof this.lab === 'string') {
      this.lab = await firstValueFrom(labService.fetch(this.lab));
    }
    return this.lab;
  }

  async resolveResearchFunding(service: ResearchFundingService): Promise<ResearchFunding> {
    if (typeof this.funding === 'string') {
      this.funding = await firstValueFrom(service.fetch(this.funding));
    }
    return this.funding;
  }

  _getCurrentResourcePage<T extends Resource>(type: ResourceType & T[ 'type' ]): ModelIndexPage<T> {
    switch (type) {
      case 'equipment_lease':
        return this.equipmentLeases as any as ModelIndexPage<T>;
      case 'software_lease':
        return this.softwareLeases as any as ModelIndexPage<T>;
      case 'input_material':
        return this.inputMaterials as any as ModelIndexPage<T>;
      case 'output_material':
        return this.outputMaterials as any as ModelIndexPage<T>;
      default:
        throw new Error(`Unrecognised resource type ${type}`)
    }
  }

  getContainer<T extends Resource>(type: T[ 'type' ] & ResourceType): LabResourceContainer<T> {
    let resources = this._getCurrentResourcePage(type);

    return {
      ...resources,
      type,
      getResourceAt: function (index: number) {
        return this.items[ index ];
      }
    }

  }
}

export interface LabResourceConsumerPatch {
  equipmentLeases?: LabResourceContainerSlice<EquipmentLease, EquipmentLeasePatch>[];
  softwareLeases?: LabResourceContainerSlice<SoftwareLease, SoftwareLeasePatch>[];
  inputMaterials?: LabResourceContainerSlice<InputMaterial, InputMaterialPatch>[];
  outputMaterials?: LabResourceContainerSlice<OutputMaterial, OutputMaterialPatch>[];
}

export function resourceConsumerPatchToJsonObject(consumer: LabResourceConsumer, patch: Partial<LabResourceConsumerPatch>) {
  const json: JsonObject = {};
  if (patch.equipmentLeases) {
    const container = consumer.getContainer('equipment_lease');
    json[ 'equipmentLeases' ] = patch.equipmentLeases
      .map(lease => resourceContainerPatchToJson(container, lease));
  }
  if (Array.isArray(patch.softwareLeases)) {
    const container = consumer.getContainer('software_lease');
    json[ 'softwareLeases' ] = patch.softwareLeases
      .map(lease => resourceContainerPatchToJson(container, lease));
  }
  if (Array.isArray(patch.inputMaterials)) {
    const container = consumer.getContainer('input_material');
    json[ 'softwareLeases' ] = patch.inputMaterials
      .map(lease => resourceContainerPatchToJson(container, lease));
  }
  if (Array.isArray(patch.outputMaterials)) {
    const container = consumer.getContainer('output_material');
    json[ 'softwareLeases' ] = patch.outputMaterials
      .map(lease => resourceContainerPatchToJson(container, lease));
  }

  return json;

}

export interface LabResourceConsumerDelegateContext<TConsumer extends LabResourceConsumer> extends ModelContext<TConsumer> {
  applyResourceConsumerPatch(patch: LabResourceConsumerPatch): Observable<TConsumer>;
}

@Injectable({ providedIn: 'root' })
export class LabResourceConsumerContext<TConsumer extends LabResourceConsumer> implements ReadOnlyModelContext<TConsumer> {
  readonly _labService = inject(LabService);
  readonly _fundingService = inject(ResearchFundingService);

  _consumerSubject = new ReplaySubject<TConsumer>(1);
  readonly committed$: Observable<TConsumer> = this._consumerSubject.asObservable();

  _consumerUrlSubject = new ReplaySubject<string>(1);
  readonly url$: Observable<string> = this._consumerUrlSubject.asObservable();

  readonly lab$ = this.committed$.pipe(
    switchMap(committed => committed.resolveLab(this._labService))
  );

  readonly funding$ = this.committed$.pipe(
    switchMap(funding => funding.resolveResearchFunding(this._fundingService))
  );

  _attachedContext: LabResourceConsumerDelegateContext<TConsumer> | null = null;
  attachContext(context: LabResourceConsumerDelegateContext<TConsumer>): Subscription {
    if (this._attachedContext !== null) {
      throw new Error('Can only associate at most one model context');
    }
    this._attachedContext = context;

    const syncCommitted = context.committed$.subscribe(
      committed => this._consumerSubject.next(committed)
    );
    const syncUrl = context.url$.subscribe(url => this._consumerUrlSubject.next(url));

    return new Subscription(() => {
      syncCommitted.unsubscribe();
      syncUrl.unsubscribe();
      this._attachedContext = null;
    });
  }

  get service(): ModelService<TConsumer> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`);
    }
    return this._attachedContext.service;
  }


  refresh(): Promise<void> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`)
    }
    return this._attachedContext.refresh();
  }

  applyResourceConsumerPatch(patch: LabResourceConsumerPatch) {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`)
    }
    return this._attachedContext.applyResourceConsumerPatch(patch);
  }
}


export interface LabResourceContainer<T extends Resource> extends ModelIndexPage<T> {
  type: T[ 'type' ];
  getResourceAt(index: number): T;
}

export interface LabResourceContainerSlice<T extends Resource, TPatch extends ResourcePatch> {
  readonly type: T[ 'type' ];
  start: number;
  end?: number;
  items: TPatch[];
}

export function resourceContainerPatchToJson<T extends Resource, TPatch extends ResourcePatch>(
  container: LabResourceContainer<T> | null,
  slice: LabResourceContainerSlice<T, TPatch>
) {
  function resourcePatchToJsonObject(index: number, patch: TPatch) {
    let current: T | null = null;
    if (container && index < container.totalItemCount) {
      current = container.getResourceAt(index);
    }

    switch (slice.type) {
      case 'equipment_lease':
        return equipmentLeasePatchToJsonObject(current as any, patch as any);
      case 'software_lease':
        return softwareLeasePatchToJsonObject(current as any, patch as any);
      case 'input_material':
        return inputMaterialPatchToJsonObject(current as any, patch as any);
      case 'output_material':
        return outputMaterialPatchToJsonObject(current as any, patch as any);
      default:
        throw new Error(`Unrecognised resource type ${slice.type}`)
    }
  }
  return {
    type: slice.type,
    startIndex: slice.start,
    endIndex: slice.end,
    items: slice.items.map(
      (item, i) => resourcePatchToJsonObject(slice.start + i, item)
    )
  };
}

@Injectable()
export class LabResourceContainerContext<T extends Resource, TPatch extends ResourcePatch> {
  readonly consumerContext = inject(LabResourceConsumerContext);

  readonly resourceTypeSubject = new BehaviorSubject<ResourceType & T[ 'type' ] | null>(null);
  readonly resourceType$: Observable<ResourceType & T[ 'type' ]> = this.resourceTypeSubject.pipe(
    filter((t): t is ResourceType & T[ 'type' ] => t != null)
  );

  constructor() {
    const _destroyRef = inject(DestroyRef);
    _destroyRef.onDestroy(() => {
      this.resourceTypeSubject.complete();
    })
  }

  readonly committed$: Observable<LabResourceContainer<T>> = combineLatest([
    this.consumerContext.committed$,
    this.resourceTypeSubject
  ]).pipe(
    switchMap(([ consumer, containerType ]) => {
      return containerType != null ? of(consumer.getContainer<T>(containerType)) : NEVER
    })
  )

  nextContainerType(type: ResourceType) {
    return this.resourceTypeSubject.next(type);
  }

  observeContainerType(type$: Observable<ResourceType>): Subscription {
    return type$.subscribe((t) => this.resourceTypeSubject.next(t));
  }

  refresh() {
    return this.consumerContext.refresh();
  }

  async _updateContainer(slices: LabResourceContainerSlice<T, TPatch>[]): Promise<LabResourceContainer<T>> {
    const type = await firstValueFrom(this.resourceType$);
    const patch = {
      [ LabResourceConsumer.consumerAttr(type) ]: slices
    };
    const consumer = await firstValueFrom(this.consumerContext.applyResourceConsumerPatch(patch));
    return consumer.getContainer(type);
  }

  async appendResource(params: TPatch): Promise<LabResourceContainer<T>> {
    const type = await firstValueFrom(this.resourceType$);
    const container = await firstValueFrom(this.committed$);
    return this._updateContainer([
      {
        type,
        start: container.totalItemCount,
        items: [ params ]
      }
    ])
  }

  async insertResourceAt(index: number, params: TPatch): Promise<LabResourceContainer<T>> {
    const type = await firstValueFrom(this.resourceType$);
    return this._updateContainer([
      {
        type,
        start: index,
        end: index,
        items: [ params ]
      }
    ]);

  }
  async updateResourceAt(index: number, params: TPatch): Promise<LabResourceContainer<T>> {
    const type = await firstValueFrom(this.resourceType$);
    return this._updateContainer([
      {
        type,
        start: index,
        end: index + 1,
        items: [ params ]
      }
    ])
  }

  async deleteResourceAt(index: number): Promise<LabResourceContainer<T>> {
    const type = await firstValueFrom(this.resourceType$);
    return this._updateContainer([
      { type, start: index, end: index + 1, items: [] }
    ]);
  }

}

export function resourceTypeFromActivatedRoute(): Observable<ResourceType> {
  const activatedRoute = inject(ActivatedRoute);

  return activatedRoute.data.pipe(
    map((data) => {
      const resourceType = data[ 'resourceType' ];
      if (!isResourceType(resourceType)) {
        throw new Error('No resource type in route data');
      }
      return resourceType;
    })
  );
}
