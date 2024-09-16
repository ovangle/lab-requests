import { LabAllocation } from "../lab/common/allocatable/lab-allocation";
import { isJsonObject, JsonObject } from "../utils/is-json-object";
import { isUUID } from "../utils/is-uuid";
import { MaterialInventory } from "./material-inventory";


export class MaterialAllocation extends LabAllocation<MaterialInventory> {
    inventoryId: string;
    materialId: string;
    materialName: string;

    isInput: boolean;
    isOutput: boolean;

    constructor(json: JsonObject) {
        super(json);
        if (!isUUID(json['inventoryId'])) {
            throw new Error(`Expected a uuid 'inventoryId'`);
        }
        this.inventoryId = json['inventoryId'];

        if (!isUUID(json['materialId'])) {
            throw new Error(`Expected a uuid 'materialId'`);
        }
        this.materialId = json['materialId'];

        if (typeof json['materialName'] !== 'string') {
            throw new Error(`Expected a string 'materialNAme'`)
        }
        this.materialName = json['materialName'];

        if (typeof json['isInput'] !== 'boolean') {
            throw new Error(`Expected a string 'materialName'`);
        }
        this.isInput = json['isInput'];

        if (typeof json['isOutput'] !== 'boolean') {
            throw new Error(`Expected a string 'materialName'`);
        }
        this.isOutput = json['isOutput'];

    }

}