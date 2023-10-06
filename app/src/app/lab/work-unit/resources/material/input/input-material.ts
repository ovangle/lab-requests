import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/coste-estimate";
import { HazardClass, hazardClassesFromJson, hazardClassesToJson } from "../../../resource/hazardous/hazardous";
import { ResourceParams } from "../../../resource/resource";
import { ResourceStorage, ResourceStorageParams, resourceStorageFromJson, resourceStorageToJson } from "../../../resource/storage/resource-storage";
import { Material } from "../material";
import { ResourceFileAttachment, resourceFileAttachmentFromJson, resourceFileAttachmentToJson } from "../../../resource/file-attachment/file-attachment";

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
    override readonly planId: string;
    override readonly workUnitId: string;
    override readonly index: number | 'create';

    name: string;
    baseUnit: string;

    numUnitsRequired: number;

    perUnitCostEstimate: CostEstimate | null; 

    storage: ResourceStorage;
    hazardClasses: HazardClass[];

    override readonly attachments: ResourceFileAttachment<InputMaterial>[];

    constructor(params: InputMaterialParams) {
        super();
        this.planId = params.planId;
        this.workUnitId = params.workUnitId;
        this.index = params.index!;

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
        this.attachments = Array.from(params?.attachments || [])
    }
}

export function inputMaterialFromJson(json: {[k: string]: any}): InputMaterial {
    const attachments = Array.from(json['attachments'] || [])
        .map(resourceFileAttachmentFromJson);

    return new InputMaterial({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
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
        planId: inputMaterial.planId,
        workUnitId: inputMaterial.workUnitId,
        index: inputMaterial.index,
        name: inputMaterial.name,
        baseUnit: inputMaterial.baseUnit,
        numUnitsRequired: inputMaterial.numUnitsRequired,
        perUnitCostEstimate: inputMaterial.perUnitCostEstimate && costEstimateToJson(inputMaterial.perUnitCostEstimate),
        storage: resourceStorageToJson(inputMaterial.storage),
        hazardClasses: hazardClassesToJson(inputMaterial.hazardClasses),
        attachments: inputMaterial.attachments.map(resourceFileAttachmentToJson)
    }
}
