import { HttpParams } from '@angular/common/http';
import { Injectable, Type, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Role, roleFromJson } from 'src/app/user/common/role';
import {
  Model,
  ModelFactory,
  ModelIndexPage,
  modelIndexPageFromJsonObject,
  ModelQuery,
  setModelQueryParams,
} from 'src/app/common/model/model';
import { RestfulService } from 'src/app/common/model/model-service';
import { isJsonObject, JsonObject } from 'src/app/utils/is-json-object';
import { isUUID } from 'src/app/utils/is-uuid';
import { parseISO } from 'date-fns';

export const FUNDING_MODEL_NAMES = ['student_project'];

export interface ResearchPurchaseOrder extends Model {
    type: string;
    budget: ResearchBudget;
    orderedById: string;
    estimatedCost: number;
    purchase: ResearchPurchase | null;
}

export const PURCAHSE_STATUSES = ['ordered' , 'ready' , 'paid' , 'reviewed'] as const;
export type PurchaseStatus = typeof PURCAHSE_STATUSES[number];

export function isPurchaseStatus(obj: unknown): obj is PurchaseStatus {
    return typeof obj === 'string' && PURCAHSE_STATUSES.includes(obj as any);
}

export class ResearchPurchase extends Model {
    budgetId: string;
    purchaseOrderType: string;
    purchaseOrderId: string;

    index: number;

    estimatedCost: number;
    actualCost: number;

    status: PurchaseStatus;

    orderedById: string;
    orderedAt: Date;

    readyAt: Date | null;
    isReady: boolean;

    paidById: string | null;
    paidAt: Date | null;
    isPaid: boolean;

    reviewedById: string | null;
    reviewedAt: Date | null;
    isReviewed: boolean;

    isFinalised: boolean;

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['budgetId'])) {
            throw new Error("Expected a uuid 'budgetId");
        }
        this.budgetId = json['budgetId'];

        if (typeof json['purchaseOrderType'] !== 'string') {
            throw new Error("Expected a string 'purchaseOrderType'")
        }
        this.purchaseOrderType = json['purchaseOrderType'];

        if (!isUUID(json['purchaseOrderId'])) {
            throw new Error("Expected a uuid 'purchaseOrderId");
        }
        this.purchaseOrderId = json['purchaseOrderId'];

        if (typeof json['index'] !== 'number') {
            throw new Error("Expected a number 'index'");
        }
        this.index = json['index'];

        if (typeof json['estimatedCost'] !== 'number') {
            throw new Error("Expected a number 'estimatedCost");
        }
        this.estimatedCost = json['estimatedCost'];

        if (typeof json['actualCost'] !== 'number') {
            throw new Error("Expected a number 'actualCost");
        }
        this.actualCost = json['actualCost'];

        if (!isPurchaseStatus(json['status'])) {
            throw new Error("Expected a purchase status 'status'");
        }
        this.status = json['status'];

        if(!isUUID(json['orderedById'])) {
            throw new Error("Expected a uuid 'orderedById");
        }
        this.orderedById = json['orderedById'];
        if (typeof json['orderedAt'] !== 'string') {
            throw new Error("Expected a string 'orderedAt");
        }
        this.orderedAt = parseISO(json['orderedAt']);

        if (json['readyAt'] == null) {
            this.readyAt = null;

        } else if (typeof json['readyAt'] === 'string') {
            this.readyAt = parseISO(json['readyAt']);
        } else {
            throw new Error("Expected a date string or null 'readyAt");
        }

        if (typeof json['isReady'] !== 'boolean') {
            throw new Error("Expected a boolean 'isReady'");
        }
        this.isReady = json['isReady'];

        if (json['paidById'] == null) {
            this.paidById = null;
        } else if (isUUID(json['paidById'])) {
            this.paidById = json['paidById'];
        } else {
            throw new Error("Expected a uuid or null 'paidById'");
        }

        if (json['paidAt'] == null) {
            this.paidAt = null;
        } else if (typeof json['paidAt'] === 'string') {
            this.paidAt = parseISO(json['paidAt']);
        } else {
            throw new Error("Expected a date string or null 'paidAt");
        }

        if (typeof json['isPaid'] !== 'boolean') {
            throw new Error("Expected a boolean 'isPaid'");
        }
        this.isPaid = json['isPaid'];

        if (json['reviewedById'] == null) {
            this.reviewedById = null;
        } else if (isUUID(json['reviewedById'])) {
            this.reviewedById = json['reviewedById'];
        } else {
            throw new Error("Expected a uuid or null 'reviewedById'");
        }

        if (json['reviewedAt'] == null) {
            this.reviewedAt = null;
        } else if (typeof json['reviewedAt'] === 'string') {
            this.reviewedAt = parseISO(json['reviewedAt']);
        } else {
            throw new Error("Expected a date string or null 'paidAt");
        }

        if (typeof json['isReviewed'] !== 'boolean') {
            throw new Error("Expected a boolean 'isReviewed'");
        }
        this.isReviewed = json['isReviewed'];

        if (typeof json['isFinalised'] !== 'boolean') {
            throw new Error("Expected a boolean 'isFinalised'");
        }
        this.isFinalised = json['isFinalised'];
    }
}

export class ResearchBudget extends Model {
  readonly name: string;
  readonly description: string;
  readonly purchases?: ModelIndexPage<ResearchPurchase>;

  constructor(json: JsonObject) {
    super(json);

    if (typeof json['name'] !== 'string') {
      throw new Error("Expected a string 'name'");
    }
    this.name = json['name'];
    if (typeof json['description'] !== 'string') {
      throw new Error("Expected a string 'description'");
    }
    this.description = json['description'];

    if (isJsonObject(json['purchases'])) {
      this.purchases = modelIndexPageFromJsonObject(ResearchPurchase, json['purchases']);
    }
  }

  match(lookup: string | ResearchFundingLookup): boolean {
    return lookupId(lookup) === this.id || lookupName(lookup) === this.name;
  }
}

export interface ResearchFundingPatch {
  readonly description: string;
  readonly requiresSupervisor: boolean;
}

export function researchFundingPatchToJsonObject(
  patch: ResearchFundingPatch,
): JsonObject {
  return {
    description: patch.description,
    requiresSupervisor: patch.requiresSupervisor,
  };
}

export interface ResearchFundingQuery extends ModelQuery<ResearchBudget> {
  // Searches for funding models with this exact name
  name_eq?: string | string[];

  // Searches for the instance of this text anywhere in the funding model
  text?: string;
}

function setResearchFundingQueryParams(params: HttpParams, query: Partial<ResearchFundingQuery>) {
  params = setModelQueryParams(params, query);
  if (query.name_eq) {
    const name = Array.isArray(query.name_eq) ? query.name_eq.join(',') : query.name_eq;
    params = params.set('name_eq', name);
  }
  if (query.text) {
    params = params.set('text', query.text);
  }
  return params;
}

export interface ResearchFundingLookup {
  id?: string;
  name?: string;
}

function lookupId(lookup: string | ResearchFundingLookup): string | null {
  if (typeof lookup === 'string') {
    return lookup;
  }
  return lookup.id || null;
}

function lookupName(lookup: string | ResearchFundingLookup): string | null {
  if (typeof lookup === 'string') {
    return null;
  }
  return lookup.name || null;
}


@Injectable({ providedIn: 'root' })
export class ResearchFundingService extends RestfulService<ResearchBudget, ResearchFundingQuery> {
  override readonly model = ResearchBudget;
  override readonly setModelQueryParams = setResearchFundingQueryParams;

  override readonly path: string = '/research/funding';

  lookup(lookup: string | ResearchFundingLookup, { useCache } = { useCache: true }): Observable<ResearchBudget | null> {
    if (useCache) {
      for (const v of this._cache.values()) {
        if (v.match(lookup)) {
          return of(v);
        }
      }
    }

    const id = lookupId(lookup);
    if (id) {
      return this.fetch(id, { useCache });
    }
    const name = lookupName(lookup);
    if (name) {
      return this.queryOne({ name_eq: name });
    }
    throw new Error('Research funding lookup must contain either id or name');
  }


  isNameUnique(name: string): Observable<boolean> {
    return this.queryPage({ name_eq: name }).pipe(
      map((page) => page.totalItemCount === 0),
    );
  }

  all(): Observable<ResearchBudget[]> {
    return this.query({});
  }
}
