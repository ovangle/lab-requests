import { Model, ModelParams, ModelRef, modelId, modelParamsFromJsonObject, modelRefJsonDecoder, resolveModelRef } from "src/app/common/model/model";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { Lab, labFromJsonObject } from "../lab";
import { firstValueFrom } from "rxjs";
import { ModelService } from "src/app/common/model/model-service";
import { Provisionable, ProvisionableCreateRequest } from "../common/provisionable/provisionable";
import { LabStorageProvision, labStorageProvisionFromJsonObject } from "./provision/lab-storage-provision";
import { Equipment, equipmentFromJsonObject } from "src/app/equipment/equipment";
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from "src/app/equipment/installation/equipment-installation";
import { StorageType, isStorageType } from "./lab-storage-type";

export interface LabStorageParams extends ModelParams {
    readonly storageType: StorageType;
    readonly lab: ModelRef<Lab>;

    // The lab equipment providing the storage capacity
    equipment: ModelRef<Equipment> | null;
    equipmentInstallation: ModelRef<EquipmentInstallation> | null;

    currentProvisions: readonly LabStorageProvision[];
}

export function labStorageFromJsonObject(json: JsonObject): LabStorage {
    const baseParams = modelParamsFromJsonObject(json);

    if (!isStorageType(json['storageType'])) {
        throw new Error("Expected a storage type 'storageType'");
    }

    const lab = modelRefJsonDecoder('lab', labFromJsonObject)(json);
    const equipment = modelRefJsonDecoder('equipment', equipmentFromJsonObject, { nullable: true })(json);
    const equipmentInstallation = modelRefJsonDecoder('equipmentInstallation', equipmentInstallationFromJsonObject, { nullable: true })(json);


    if (!Array.isArray(json['currentProvisions']) || !json['currentProvisions'].every(isJsonObject)) {
        throw new Error("Expected an array of objets 'currentProvisions'")
    }
    const currentProvisions = json['currentProvisions'].map(
        labStorageProvisionFromJsonObject
    );

    return new LabStorage({
        ...baseParams,
        storageType: json['storageType'],
        lab,
        equipment,
        equipmentInstallation,
        currentProvisions,
    });
}

export class LabStorage extends Model
    implements LabStorageParams, Provisionable<LabStorageProvision> {
    readonly storageType: StorageType;

    lab: ModelRef<Lab>;
    equipment: ModelRef<Equipment> | null;
    equipmentInstallation: ModelRef<EquipmentInstallation> | null;

    currentProvisions: readonly LabStorageProvision[];

    constructor(
        params: LabStorageParams
    ) {
        super(params);
        this.storageType = params.storageType;
        this.lab = params.lab;

        this.equipment = params.equipment;
        this.equipmentInstallation = params.equipmentInstallation;

        this.currentProvisions = params.currentProvisions;
    }

    async resolveLab(using: ModelService<Lab>) {
        if (typeof this.lab === 'string') {
            this.lab = await firstValueFrom(using.fetch(this.lab));
        }
        return this.lab;
    }

    async resolveEquipment(using: ModelService<Equipment>) {
        if (typeof this.equipment === 'string') {
            this.equipment = await firstValueFrom(using.fetch(this.equipment));
        }
        return this.equipment;
    }

    resolveEquipmentInstallation(using: ModelService<EquipmentInstallation>) {
        return resolveModelRef(this, 'equipmentInstallation', using as any);
    }
}

export interface LabStorageCreateRequest extends ProvisionableCreateRequest<LabStorage> {
    lab: ModelRef<Lab>;
    storageType: StorageType;

    // The storage should be a piece of equipment in the lab.
    equipment: ModelRef<Equipment> | null;
}

export function labStorageCreateRequestToJsonObject(request: LabStorageCreateRequest): JsonObject {
    return {
        lab: modelId(request.lab),
        storageType: request.storageType,
        equipment: modelId(request.equipment)
    }

}