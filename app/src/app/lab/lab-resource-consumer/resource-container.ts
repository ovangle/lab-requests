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
      case 'equipment-lease':
        return this.equipmentLeases as any as ModelIndexPage<T>;
      case 'software-lease':
        return this.softwareLeases as any as ModelIndexPage<T>;
      case 'input-material':
        return this.inputMaterials as any as ModelIndexPage<T>;
      case 'output-material':
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

export interface LabResourceConsumerDelegateContext<TConsumer extends LabResourceConsumer> extends ModelContext<TConsumer> {
  appendResource<T extends Resource>(resourceType: ResourceType & T[ 'type' ], params: ResourcePatch<T>): Promise<TConsumer>;
  insertResourceAt<T extends Resource>(resourceType: ResourceType & T[ 'type' ], index: number, params: ResourcePatch<T>): Promise<TConsumer>;
  updateResourceAt<T extends Resource>(resourceType: ResourceType & T[ 'type' ], index: number, params: ResourcePatch<T>): Promise<TConsumer>;
  deleteResourceAt(resourceType: ResourceType, index: number): Promise<TConsumer>;
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

  appendResource<T extends Resource>(resourceType: ResourceType & T[ 'type' ], params: ResourcePatch<T>): Promise<TConsumer> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`);
    }
    return this._attachedContext.appendResource(resourceType, params);
  }
  insertResourceAt<T extends Resource>(resourceType: ResourceType & T[ 'type' ], index: number, params: ResourcePatch<T>): Promise<TConsumer> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`);
    }
    return this._attachedContext.insertResourceAt(resourceType, index, params);
  }
  updateResourceAt<T extends Resource>(resourceType: ResourceType & T[ 'type' ], index: number, params: ResourcePatch<T>): Promise<TConsumer> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`);
    }
    return this._attachedContext.updateResourceAt(resourceType, index, params);
  }
  deleteResourceAt(resourceType: ResourceType, index: number): Promise<TConsumer> {
    if (this._attachedContext == null) {
      throw new Error(`No attached context`);
    }
    return this._attachedContext.deleteResourceAt(resourceType, index);
  }
}


export interface LabResourceContainer<T extends Resource> extends ModelIndexPage<T> {
  type: T[ 'type' ];
  getResourceAt(index: number): T;
}

@Injectable()
export class LabResourceContainerContext<T extends Resource> {
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


  async appendResource(params: ResourcePatch<T>): Promise<LabResourceContainer<T>> {
    const resourceType = await firstValueFrom(this.resourceType$);
    const consumer = await this.consumerContext.appendResource(resourceType, params);
    return consumer.getContainer(resourceType);
  }
  async insertResourceAt(index: number, params: ResourcePatch<T>): Promise<LabResourceContainer<T>> {
    const resourceType = await firstValueFrom(this.resourceType$);
    const consumer = await this.consumerContext.insertResourceAt(resourceType, index, params);
    return consumer.getContainer(resourceType);
  }
  async updateResourceAt(index: number, params: ResourcePatch<T>): Promise<LabResourceContainer<T>> {
    const resourceType = await firstValueFrom(this.resourceType$);
    const consumer = await this.consumerContext.updateResourceAt(resourceType, index, params);
    return consumer.getContainer(resourceType);

  }
  async deleteResourceAt(index: number): Promise<LabResourceContainer<T>> {
    const resourceType = await firstValueFrom(this.resourceType$);
    const consumer = await this.consumerContext.deleteResourceAt(resourceType, index);
    return consumer.getContainer(resourceType);
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

function provideResourceContainerContext(): Provider {
  return {
    provide: LabResourceContainerContext,
    useFactory: () => {
      const resourceType$ = resourceTypeFromActivatedRoute();
      const context = new LabResourceContainerContext();
      context.observeContainerType(resourceType$);
      return context;
    },
    deps: []
  }
}