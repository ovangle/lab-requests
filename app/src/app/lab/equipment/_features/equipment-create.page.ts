import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { Equipment, EquipmentContext, EquipmentPatch } from "../equipment";
import { Subscription, of } from "rxjs";
import { EquipmentForm, EquipmentFormService } from "../equipment-form.service";
import { Router } from "@angular/router";

const equipmentCreateFixture: EquipmentPatch = {
    name: 'HP Elitebook',
    description: 'My personal laptop',
    tags: ['laptop'],
    trainingDescriptions: [],
    availableInLabTypes: []
};


@Component({
    selector: 'lab-equipment-create-page',
    template: `
    <h1>
        Create equipment
    </h1>

    <lab-equipment-form 
        [form]="form"
        [committed]="null"
        (requestCommit)="createEquipment($event)">
    </lab-equipment-form>
    `,
    providers: [
        EquipmentFormService
    ]
})
export class EquipmentCreatePage {
    readonly _cdRef = inject(ChangeDetectorRef);
    readonly _router = inject(Router);

    readonly context = inject(EquipmentContext);

    readonly _formService = inject(EquipmentFormService);
    get form(): EquipmentForm {
        return this._formService.form;
    }

    constructor() {
        this.context.initCreateContext();
    }

    ngOnInit() {
        this.form.setValue(equipmentCreateFixture);
        this._cdRef.markForCheck();
    }

    async createEquipment(patch: EquipmentPatch) {
        const equipment = await this.context.create(patch)
        await this._router.navigate(['lab', 'equipments', equipment.id])
    }

}