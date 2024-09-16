import { isUnitOfMeasurement, UnitOfMeasurement } from "../common/measurement/measurement";
import { Model, ModelIndexPage, modelIndexPageFromJsonObject } from "../common/model/model";
import { isJsonObject, JsonObject } from "../utils/is-json-object";

import {MaterialInventory} from './material-inventory';


export class Material extends Model {
    name: string;
    unitOfMeasurement: UnitOfMeasurement;

    inventories: ModelIndexPage<MaterialInventory>

    constructor(json: JsonObject) {
        super(json);

        if (typeof json['name'] !== 'string') {
            throw new Error(`Expected a string 'name'`);
        }
        this.name = json['name'];

        if (!isUnitOfMeasurement(json['unitOfMeasurement'])) {
            throw new Error(`Expected a unit of measurement 'unitOfMeasurement'`);
        }
        this.unitOfMeasurement = json['unitOfMeasurement'];

        if (!isJsonObject(json['inventories'])) {
            throw new Error(`Expected a json object 'inventories'`);
        }
        this.inventories = modelIndexPageFromJsonObject(MaterialInventory, json);
    }
}