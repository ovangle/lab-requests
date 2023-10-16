import { HazardClass, hazardClassesFromJson, hazardClassesToJson } from "../../../resource/hazardous/hazardous";
import { ResourceParams } from "../../../resource/resource";
import { ResourceStorage, ResourceStorageParams, resourceStorageFromJson, resourceStorageParamsToJson } from "../../../resource/storage/resource-storage";
import { Material } from "../material";
import { ResourceFileAttachment, resourceFileAttachmentFromJson, resourceFileAttachmentToJson } from "../../../resource/file-attachment/file-attachment";
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/cost-estimate";

export interface InputMaterialParams extends ResourceParams<InputMaterial> {
    name: string;
    baseUnit: string;

    numUnitsRequired: number;
    perUnitCostEstimate: CostEstimate | null;

    storage: ResourceStorage | ResourceStorageParams;
    hazardClasses?: HazardClass[];
}

export class InputMaterial extends Material {
    override readonly type = 'input-material';

    name: string;
    baseUnit: string;

    numUnitsRequired: number;

    perUnitCostEstimate: CostEstimate | null; 

    storage: ResourceStorage;
    hazardClasses: HazardClass[];

    constructor(params: InputMaterialParams) {
        super(params);

        if (!params.name) {
            throw new Error('Invalid InputMaterial. Must provide name')
        }
        this.name = params.name;

        if (!params.baseUnit) {
            throw new Error('Invalid InputMaterial. Must provide base units');
        }
        this.baseUnit = params.baseUnit;

        this.numUnitsRequired = params.numUnitsRequired || 0;
        this.perUnitCostEstimate = params.perUnitCostEstimate || null;
        this.storage = new ResourceStorage(params.storage);
        this.hazardClasses = params?.hazardClasses || [];
    }
}

export function inputMaterialFromJson(json: {[k: string]: any}): InputMaterial {
    const attachments = Array.from(json['attachments'] || [])
        .map(resourceFileAttachmentFromJson);

    return new InputMaterial({
        containerId: json['containerId'],
        id: json['id'],
        index: json['index'],
        name: json['name'],
        baseUnit: json['baseUnit'],
        numUnitsRequired: json['numUnitsRequired'],
        perUnitCostEstimate: json['perUnitCostEstimate'] ? costEstimateFromJson(json['perUnitCostEstimate']) : null,
        storage: resourceStorageFromJson(json['storage']),
        hazardClasses: hazardClassesFromJson(json['hazardClasses']),
        attachments
    })
}


export function inputMaterialToJson(inputMaterial: InputMaterial): {[k: string]: any} {
    return {
        containerId: inputMaterial.containerId,
        id: inputMaterial.id,
        index: inputMaterial.index,
        name: inputMaterial.name,
        baseUnit: inputMaterial.baseUnit,
        numUnitsRequired: inputMaterial.numUnitsRequired,
        perUnitCostEstimate: inputMaterial.perUnitCostEstimate && costEstimateToJson(inputMaterial.perUnitCostEstimate),
        storage: resourceStorageParamsToJson(inputMaterial.storage),
        hazardClasses: hazardClassesToJson(inputMaterial.hazardClasses),
        attachments: inputMaterial.attachments.map(resourceFileAttachmentToJson)
    }
}
