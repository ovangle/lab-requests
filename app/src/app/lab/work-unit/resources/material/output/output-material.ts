import { ResourceDisposal, ResourceDisposalParams, resourceDisposalFromJson, resourceDisposalToJson } from "../../../resource/disposal/resource-disposal";
import { HazardClass, hazardClassesFromJson, hazardClassesToJson } from "../../../resource/hazardous/hazardous";
import { ResourceParams } from "../../../resource/resource";
import { ResourceStorage, ResourceStorageParams, resourceStorageFromJson, resourceStorageToJson } from "../../../resource/storage/resource-storage";
import { Material } from "../material";

export interface OutputMaterialParams extends ResourceParams<OutputMaterial> {
    name: string;
    baseUnit: string;
    numUnitsProduced: number;
    disposal: ResourceDisposal | ResourceDisposalParams;
    storage: ResourceStorage | ResourceStorageParams;
    hazardClasses: HazardClass[];
}

export class OutputMaterial extends Material {
    override readonly type = 'output-material';
    override readonly planId: string;
    override readonly workUnitId: string;
    override readonly index: number | 'create';

    name: string;
    baseUnit: string;

    numUnitsProduced: number;

    storage: ResourceStorage;
    disposal: ResourceDisposal;

    hazardClasses: HazardClass[];

    constructor(params: OutputMaterialParams) {
        super();

        this.planId = params.planId;
        this.workUnitId = params.workUnitId;

        this.index = params.index!;

        if (!params.name) {
            throw new Error('Invalid OutputMaterial. Name must be provided');
        }
        this.name = params.name;

        if (!params.baseUnit) {
            throw new Error('Invalid OutputMaterial. Base units must be provided');
        }
        this.baseUnit = params.baseUnit;

        this.numUnitsProduced = params.numUnitsProduced || 0;

        this.storage = new ResourceStorage(params.storage);
        this.disposal = new ResourceDisposal(params.disposal);

        this.hazardClasses = params?.hazardClasses || [];
    }
}

export function outputMaterialFromJson(json: { [k: string]: any }): OutputMaterial {
    return new OutputMaterial({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        index: json['index'],
        name: json['name'],
        baseUnit: json['baseUnit'],
        numUnitsProduced: json['numUnitsProduced'],
        storage: resourceStorageFromJson(json['storage']),
        disposal: resourceDisposalFromJson(json['disposal']),
        hazardClasses: hazardClassesFromJson(json['hazardClasses'])
    })
}


export function outputMaterialToJson(outputMaterial: OutputMaterial): { [k: string]: any } {
    return {
        type: outputMaterial.type,
        name: outputMaterial.name,
        baseUnit: outputMaterial.baseUnit,
        numUnitsProduced: outputMaterial.numUnitsProduced,
        storage: resourceStorageToJson(outputMaterial.storage),
        disposal: resourceDisposalToJson(outputMaterial.disposal),
        hazardClasses: hazardClassesToJson(outputMaterial.hazardClasses)
    }
}
