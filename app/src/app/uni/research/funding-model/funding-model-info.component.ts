import { Component, Input } from "@angular/core";
import { FundingModel } from "./funding-model";
import { CommonModule } from "@angular/common";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";


@Component({
    selector: 'uni-research-funding-model-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    {{fundingModel.name}}
    <ng-container *ngIf="!nameonly">
        - {{fundingModel.description}}
    </ng-container>
    `
})
export class FundingModelInfoComponent {
    @Input({required: true})
    fundingModel: FundingModel;

    @Input()
    get nameonly(): boolean {
        return this._nameonly;
    }
    set nameonly(value: BooleanInput) {
        this._nameonly = coerceBooleanProperty(value);
    }
    _nameonly: boolean = false;
}