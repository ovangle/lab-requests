import { Component } from "@angular/core";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, isLabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "../../common/provisionable/abstract-lab-provision-create-form.component";
import { LabStorageProvision, StoreConsumableRequest } from "./lab-storage-provision";
import { ModelRef } from "src/app/common/model/model";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { LabStorage, LabStorageCreateRequest } from "../lab-storage";

export type StoreConsumableFormGroup = LabProvisionCreateFormGroup<{

}>;

function isStoreConsumableFormGroup(obj: unknown): obj is StoreConsumableFormGroup {
    return isLabProvisionCreateFormGroup(obj)
}

export function storeConsumableFormGroup(): StoreConsumableFormGroup {
    return labProvisionCreateFormGroup(
        {},
        {
            defaultFunding: null,
            defaultNumRequired: 4,
            defaultUnitOfMeasurement: 'units'

        }
    )
}

function storeConsumableRequestFromFormValue(
    target: ModelRef<LabStorage> | LabStorageCreateRequest,
    value: StoreConsumableFormGroup['value']
): StoreConsumableRequest {
    return labProvisionCreateRequestFromFormValue(
        'store_consumable',
        target,
        value
    );
}


@Component({
    selector: 'lab-storage-store-consumable-form',
    standalone: true,
    imports: [],
    template: `
    `
})
export class StoreConsumableFormComponent extends AbstractLabProvisionCreateFormComponent<
    LabStorageProvision,
    StoreConsumableFormGroup,
    StoreConsumableRequest
> {
    protected override readonly __isFormGroupInstance = isStoreConsumableFormGroup;
    protected override readonly __createStandaloneForm = storeConsumableFormGroup;
    protected override readonly __createRequestFromFormValue(target: ModelRef<LabStorage> | LabStorageCreateRequest, form: Partial<{ numRequired: number; unit: string; hasCostEstimates: boolean; estimatedCost?: Partial<{ funding: ResearchFunding | null; perUnitCost: number; }> | undefined; }>): StoreConsumableRequest {
        throw new Error("Method not implemented.");
    }


}
