import { FormArray, FormGroup, ValidationErrors } from "@angular/forms";
import { Software, SoftwareForm, SoftwareFormErrors, createSoftwareForm } from "./software/software";
import { InputMaterial, InputMaterialForm, InputMaterialFormErrors, createInputMaterialForm } from "./material/input/input-material";
import { OutputMaterial, OutputMaterialForm, OutputMaterialFormErrors, createOutputMaterialForm } from "./material/output/output-material";
import { Resource, ResourceType } from "./common/resource";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, map } from "rxjs";
import { Service, ServiceForm, ServiceFormErrors, serviceForm } from "./service/service";
import { EquipmentLease, EquipmentLeaseForm, EquipmentLeaseFormErrors } from "./equipment/equipment-lease";
import { ModelService } from "src/app/utils/models/model-service";
import { Context } from "src/app/utils/models/model-context";
import { ResourceContainerForm } from "./resource-container-form";


export class ResourceContainer {
    equipments: EquipmentLease[];
    services: Service[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: Partial<ResourceContainer>) {
        this.equipments = (params.equipments || [])
            .map(e => new EquipmentLease(e));
        this.services = (params.services || [])
            .map(s => new Service(s));
        this.softwares = (params.softwares || [])
            .map(s => new Software(s));
        this.inputMaterials = (params.inputMaterials || [])
            .map(inputMaterial => new InputMaterial(inputMaterial));
        this.outputMaterials = (params.outputMaterials || [])
            .map(outputMaterial => new OutputMaterial(outputMaterial));
    }

    getResources<T extends Resource>(t: ResourceType & T['type']): readonly T[] {
        switch (t) {
            case 'equipment':
                return this.equipments as any[];
            case 'software':
                return this.softwares as any[];
            case 'service':
                return this.services as any[];
            case 'input-material':
                return this.inputMaterials as any[];
            case 'output-material':
                return this.outputMaterials as any[];
            default:
                throw new Error(`Unexpected resource type ${t}`)
        }
    }

    getResourceAt<T extends Resource>(t: ResourceType & T['type'], index: number): T {
        const resources = this.getResources(t);
        if (index < 0 || index >= resources.length) {
            throw new Error(`No resource at ${index}`);
        }
        return resources[index];
    }
}

export class ResourceContainerPatch {
    addEquipments: EquipmentLease[];
    replaceEquipments: {[k: number]: EquipmentLease | null};

    addServices: Service[];
    replaceServices: {[k: number]: Service | null};

    addSoftwares: Software[];
    replaceSoftwares: {[k: number]: Software | null}

    addInputMaterials: InputMaterial[]; 
    replaceInputMaterials: {[k: number]: InputMaterial | null};

    addOutputMaterials: OutputMaterial[];
    replaceOutputMaterials: {[k: number]: OutputMaterial | null};
}

export function resourceContainerPatchFromContainer(container: ResourceContainer): ResourceContainerPatch {
    return {
        addEquipments: [],
        replaceEquipments: {},
        addServices: [],
        replaceServices: {},
        addSoftwares: [],
        replaceSoftwares: {},
        addInputMaterials: [],
        replaceInputMaterials: {},
        addOutputMaterials: [],
        replaceOutputMaterials: {}
    }
}

export type ResourceContainerPatchErrors = ValidationErrors & {
    addEquipments?: (EquipmentLeaseFormErrors | null)[];
    replaceEquipments?: {[k: string]: EquipmentLeaseFormErrors };

    addSoftwares?: (SoftwareFormErrors | null)[];
    replaceSoftwares?: {[k: string]: SoftwareFormErrors };

    addServices?: (ServiceFormErrors | null)[];
    replaceServices?: {[k: string]: ServiceFormErrors };

    addInputMaterials?: (InputMaterialFormErrors | null)[];
    replaceInputMaterials?: {[k: string]: InputMaterialFormErrors };

    addOutputMaterials?: (OutputMaterialFormErrors | null)[];
    replaceOutputMaterials?: {[k: string]: OutputMaterialFormErrors };
}

@Injectable()
export abstract class ResourceContainerContext<T extends ResourceContainer & { readonly id: string; }, TPatch extends ResourceContainerPatch = ResourceContainerPatch> {
    abstract readonly committed$: Observable<T | null>;

    abstract commitContext(patch: TPatch): Promise<T>;

    committedResources$(resourceType: ResourceType) {
        return this.committed$.pipe(
            map(committed => committed ? committed.getResources(resourceType) : [])
        );
    }

    async commit(patch: TPatch): Promise<T> {
        const committed = await firstValueFrom(this.committed$);
        if (!committed) {
            throw new Error('Cannot commit resources until container exists');
        }
        return this.commitContext(patch);
    }

    abstract form: ResourceContainerForm<any>;
}