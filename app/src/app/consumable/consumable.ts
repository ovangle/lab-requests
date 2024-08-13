import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { Model, ModelParams, ModelRef } from "src/app/common/model/model";
import { Lab } from "../lab/lab";
import { LabProvision } from "../lab/common/provisionable/provision";


export interface Consumable extends Model {
    readonly name: string;
    readonly measurementUnit: UnitOfMeasurement;
}

export interface ConsumableStockParams<TConsumable extends Consumable> extends ModelParams {

}

export class LabInventory<TConsumable extends Consumable> extends Model
    implements Provisionable<LabStockProvision> {
    lab: ModelRef<Lab>;
    consumable: ModelRef<Consumable>;

    quantity: [number, UnitOfMeasurement];
}

export class LabInventoryProvision<TConsumable extends Consumable> extends
    LabProvision<LabInventory<TConsumable>> {

}