import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentTransferFormComponent, EquipmentTransferFormGroup } from "../installation/provisions/equipment-transfer-form.component";
import { EquipmentInstallationService } from "../installation/equipment-installation";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";
import { EquipmentInstallationContext, provideEquipmentInstallationContext } from "../installation/equipment-installation-context";
import { ResearchBudgetService } from "src/app/research/budget/research-budget";
import { firstValueFrom, map, shareReplay, switchMap } from "rxjs";
import { provideResearchBudgetContext, ResearchBudgetContext } from "src/app/research/budget/research-budget-context";
import { purchaseOrderRequestFromFormValue } from "src/app/research/budget/research-purchase-order-form.component";
import { EquipmentTransferRequest } from "../provision/equipment-provision";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        EquipmentTransferFormComponent
    ],
    template: `
    <h1>Transfer equipment</h1>

    @let installation=installation$ | async;

    @if (labBudget$ | async; as labBudget) {
        <equipment-transfer-form [sourceInstallation]="installation!"
                                 [budget]="labBudget"
                                 (submit)="onSubmit($event)"
                                 (cancel)="onCancel()"/>
    }
    `,
    providers: [
        provideEquipmentInstallationContext(),
        provideResearchBudgetContext({ isOptionalParam: true })
    ]

})
export class EquipmentTransferFormPage {
    formPane = inject(ScaffoldFormPaneControl);

    _researchBudgetContext = inject(ResearchBudgetContext);
    _installationContext = inject(EquipmentInstallationContext);

    installation$ = this._installationContext.committed$;

    /**
     * This transfer is being launched from the equipment page,
     * so the purchase is taken out of the lab budget.
     */
    labBudget$ = this._researchBudgetContext.committed$;

    ngOnInit() {
        this._researchBudgetContext.defaultToLabBudget(this.installation$.pipe(
            map(installation => installation.labId)
        ))
    }


    async onSubmit(value: EquipmentTransferFormGroup['value']) {
        const installation = await firstValueFrom(this.installation$);
        const budget = await firstValueFrom(this.labBudget$);

        const request: EquipmentTransferRequest = {
            type: 'equipment_transfer',
            equipment: installation.equipmentId,
            lab: installation.labId,
            destinationLab: value.destination!,
            numTransferred: value.numTransferred!,
            purchaseOrder: purchaseOrderRequestFromFormValue(
                budget,
                'transfer_equipment',
                value['purchase']
            )
        };

        await this._installationContext.transferEquipment(request);

        this.formPane.close();
    }

    onCancel() {
        this.formPane.close();
    }
}