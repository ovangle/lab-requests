import { parseISO } from "date-fns";
import { isUnitOfMeasurement, UnitOfMeasurement } from "../common/measurement/measurement";
import { Model, ModelFactory, modelId, ModelIndexPage, modelIndexPageFromJsonObject, ModelQuery, setModelQueryParams } from "../common/model/model";
import { Allocatable } from "../lab/common/allocatable/lab-allocation";
import { isJsonObject, JsonObject } from "../utils/is-json-object";
import { isUUID } from "../utils/is-uuid";

import { ResearchPurchase } from "../research/budget/research-budget";
import { MaterialAllocation } from "./material-allocation";
import { Injectable } from "@angular/core";
import { ModelService, RestfulService } from "../common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Lab } from "../lab/lab";


export class MaterialInventory extends Model implements Allocatable<MaterialAllocation> {
    materialId: string;
    materialName: string;

    unitOfMeasurement: UnitOfMeasurement;

    lastMeasuredQuantity: number;
    lastMeasuredAt: Date;
    lastMeasuredById: string;

    estimatedQuantity: number;

    procurements: ModelIndexPage<MaterialInventoryProcurement>;
    dispositions: ModelIndexPage<MaterialInventoryDisposition>;

    consumptions: ModelIndexPage<MaterialConsumption>;
    productions: ModelIndexPage<MaterialProduction>;

    allocationType = 'material_allocation'
    activeAllocations: ModelIndexPage<MaterialAllocation>;

    constructor(json: JsonObject) {
        super(json);

        if (!isUUID(json['materialId'])) {
            throw new Error(`Expected a uuid 'materialId'`);
        }
        this.materialId = json['materialId'];

        if (typeof json['materialName'] !== 'string') {
            throw new Error(`Expected a string 'materialName'`);
        }
        this.materialName = json['materialName'];

        if (!isUnitOfMeasurement(json['unitOfMeasurement'])) {
            throw new Error(`Expected a unit of measurement 'unitOfMeasurement'`);
        }
        this.unitOfMeasurement = json['unitOfMeasurement'];

        if (typeof json['lastMeasuredQuantity'] !== 'number') {
            throw new Error(`Expected a number 'lastMeasuredQuantity'`);
        }
        this.lastMeasuredQuantity = json['lastMeasuredQuantity'];

        if (typeof json['lastMeasuredAt'] !== 'string') {
            throw new Error(`Expected a datetime string 'lastMeasuredAt'`);
        }
        this.lastMeasuredAt = parseISO(json['lastMeasuredAt']);

        if (!isUUID(json['lastMeasuredById'])) {
            throw new Error(`Expected a uuid 'lastMeasuredById'`);
        }
        this.lastMeasuredById = json['lastMeasuredById'];

        if (typeof json['estimatedQuantity'] !== 'number') {
            throw new Error(`Expected a number 'estimatedQuantity'`);
        }
        this.estimatedQuantity = json['estimatedQuantity'];

        if (!isJsonObject(json['imports'])) {
            throw new Error(`Expected a json object 'imports'`);
        }
        this.procurements = modelIndexPageFromJsonObject(
            MaterialInventoryProcurement,
            json['imports']
        );
        if (!isJsonObject(json['exports'])) {
            throw new Error(`Expected a json object 'exports'`);
        }
        this.dispositions = modelIndexPageFromJsonObject(
            MaterialInventoryDisposition,
            json['exports']
        )

        if (!isJsonObject(json['consumptions'])) {
            throw new Error(`Expected a json object 'consumptions'`);
        }
        this.consumptions = modelIndexPageFromJsonObject(
            MaterialConsumption,
            json['consumptions']
        );

        if (!isJsonObject(json['productions'])) {
            throw new Error(`Expected a json object 'productions'`);
        }
        this.productions = modelIndexPageFromJsonObject(
            MaterialProduction,
            json['productions']
        )

        if (!isJsonObject(json['consumptions'])) {
            throw new Error(`Expected a json object 'consumptions'`);
        }
        this.consumptions = modelIndexPageFromJsonObject(
            MaterialConsumption,
            json['consumptions']
        );

        if (!isJsonObject(json['activeAllocations'])) {
            throw new Error(`Expected a json object 'activeAllocations'`);
        }
        this.activeAllocations = modelIndexPageFromJsonObject(
            MaterialAllocation,
            json['activeAllocations']
        );

    }
}

export interface MaterialInventoryQuery extends ModelQuery<MaterialInventory> {
    lab: Lab | string;
}

function setMaterialInventoryQueryParams(params: HttpParams, query: Partial<MaterialInventoryQuery>) {
    params = setModelQueryParams(params, query);

    if (query.lab) {
        params = params.set('lab', modelId(query.lab));
    }

    return params;
}

@Injectable({providedIn: 'root'})
export class MaterialInventoryService extends RestfulService<MaterialInventory, MaterialInventoryQuery> {
    override readonly path = '/material/inventories';
    override readonly model = MaterialInventory;

    override setModelQueryParams(params: HttpParams, lookup: Partial<MaterialInventoryQuery>): HttpParams {
        return setMaterialInventoryQueryParams(params, lookup);
    }
}

export class MaterialInventoryProcurement extends Model {
    purchaseId: string;
    inventoryId: string;
    quantity: number;

    constructor(json: JsonObject) {
        super(json);
        if (!isUUID(json['purchaseId'])) {
            throw new Error(`Expected a json object 'purchase'`);
        }
        this.purchaseId = json['purchaseId'];

        if (!isUUID(json['inventoryId'])) {
            throw new Error(`Expected a uuid 'inventoryId'`);
        }
        this.inventoryId = json['inventoryId'];

        if (typeof json['quantity'] !== 'number') {
            throw new Error(`Expected a number 'quantity'`);
        }
        this.quantity = json['quantity'];
    }
}



export class MaterialInventoryDisposition extends Model {
    disposalId: string;
    inventoryId: string;
    quantity: number;

    constructor(json: JsonObject) {
        super(json);
        if (!isUUID(json['disposalId'])) {
            throw new Error(`Expected a uuid 'disposal'`);
        }
        this.disposalId = json['disposalId'];

         if (!isUUID(json['inventoryId'])) {
            throw new Error(`Expected a uuid 'inventoryId'`);
        }
        this.inventoryId = json['inventoryId'];

        if (typeof json['quantity'] !== 'number') {
            throw new Error(`Expected a number 'quantity'`);
        }
        this.quantity = json['quantity'];

    }

}

export class MaterialConsumption extends Model {
    inputMaterialId: string;
    inventoryId: string;
    quantity: number;

    constructor(json: JsonObject) {
        super(json);
        if (!isUUID(json['inputMaterialId'])) {
            throw new Error(`Expected a uuid 'inputMaterialId'`);
        }
        this.inputMaterialId = json['inputMaterialId'];

        if (!isUUID(json['inventoryId'])) {
            throw new Error(`Expected a uuid 'inventoryId'`);
        }
        this.inventoryId = json['inventoryId'];

        if (typeof json['quantity'] !== 'number') {
            throw new Error(`Expected a number 'quantity'`);
        }
        this.quantity = json['quantity'];
    }
}

export class MaterialProduction extends Model {
    outputMaterialId: string;
    inventoryId: string;
    quantity: number;

    constructor(json: JsonObject) {
        super(json);
        if (!isUUID(json['outputMaterialId'])) {
            throw new Error(`Expected a json object 'purchase'`);
        }
        this.outputMaterialId = json['outputMaterialId'];

        if (!isUUID(json['inventoryId'])) {
            throw new Error(`Expected a uuid 'inventoryId'`);
        }
        this.inventoryId = json['inventoryId'];

        if (typeof json['quantity'] !== 'number') {
            throw new Error(`Expected a number 'quantity'`);
        }
        this.quantity = json['quantity'];
    }
}
