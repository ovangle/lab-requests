import { Model, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { ALL_RESOURCE_TYPES, ResourceType, resourceTypeFromJson } from "../../work-unit/resource/resource-type";
import { CostEstimate, costEstimateFromJson } from "src/app/uni/research/funding/cost-estimate/cost-estimate";
import {validate as validateIsUUID} from 'uuid';
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { isUUID } from "src/app/utils/is-uuid";

export interface ResourceBudgetSummary {
    readonly resourceType: ResourceType;

    readonly cost: CostEstimate | null;
}

function resourceBudgetSummaryFromJsonObject(json: unknown): ResourceBudgetSummary {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }
    const cost = json['cost'] ? costEstimateFromJson(json['cost']) : null;
    return {
        resourceType: resourceTypeFromJson(json['type']),
        cost
    };
}

type ResourceBudgetSummaries = Partial<Record<ResourceType, ResourceBudgetSummary>>;

function resourceBudgetSummariesFromJson(json: unknown): ResourceBudgetSummaries {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }

    const result: ResourceBudgetSummaries = {};
    for (const type of ALL_RESOURCE_TYPES) {
        if (type in json && isJsonObject(json[type])) {
            result[type] = resourceBudgetSummaryFromJsonObject(json[type]);
        }
    }
    return result;
}



export interface BudgetSummaryParams extends ModelParams {
    readonly planId: string;

    readonly resourceSummaries: Partial<Record<ResourceType, ResourceBudgetSummary>>;
}
export class BudgetSummary extends Model implements BudgetSummaryParams{
    readonly planId: string;

    readonly resourceSummaries : Partial<Record<ResourceType, ResourceBudgetSummary>>; 

    constructor(params: BudgetSummaryParams) {
        super(params);
        this.planId = params.planId;
        this.resourceSummaries = params.resourceSummaries;
    }
}

function budgetSummaryParamsFromJson(json: unknown): BudgetSummaryParams {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }
    if (!isUUID(json['planId']))  {
        throw new Error('planId must be a UUID')
    }

    return {
        ...modelParamsFromJsonObject(json),
        planId: json['planId'],
        resourceSummaries: resourceBudgetSummariesFromJson(json['resourceSummaries'])
    }
}