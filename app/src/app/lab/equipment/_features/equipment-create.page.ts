import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentContext } from "../equipment";
import { Subscription, of } from "rxjs";
import { EquipmentForm, EquipmentFormService } from "../equipment-form.service";


@Component({
    selector: 'lab-equipment-create-page',
    template: `
    <h1>Create equipment</h1>

    <lab-equipment-form 
        [form]="form"
        [committed]="null">
    </lab-equipment-form>
    `,
    providers: [
        EquipmentFormService
    ]
})
export class EquipmentCreatePage {
    readonly context = inject(EquipmentContext);

    readonly _formService = inject(EquipmentFormService);
    get form(): EquipmentForm {
        return this._formService.form;
    }

    constructor() {
        this.context.initCreateContext();
    }
}