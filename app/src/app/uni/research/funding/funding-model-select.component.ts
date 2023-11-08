import { Component, OnInit, inject } from "@angular/core";
import { ActorContext } from "src/app/actor/actor";
import { FundingModel, FundingModelCollection } from "./funding-model";
import { Observable } from "rxjs";
import { injectModelQuery } from "src/app/common/model/model-collection";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";
import { ControlValueAccessor, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";


@Component({
    selector: 'uni-funding-model-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    template: ` 
    <mat-form-field>
        <mat-label><ng-content select="mat-label"></ng-content></mat-label>
        <mat-select [formControl]="formControl">
        </mat-select>
    </mat-form-field>
    `,
})
export class FundingModelSelect implements ControlValueAccessor {
    
    readonly _actorContext = inject(ActorContext);

    readonly collection = inject(FundingModelCollection);
    readonly options$ = this.collection.pageItems$;

    readonly formControl = new FormControl<FundingModel | null>(null);


    writeValue(obj: FundingModel | string | null): void {
        if (obj instanceof FundingModel || obj == null) {
            this.formControl.setValue(obj);
        } else if (typeof obj === 'string') {
            this.collection.get(obj).then(result => {
                this.formControl.setValue(result); 
            }).catch(err => {
                this.formControl.setValue(null); 
            })
        }

    }
    _onChange: (value: any) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this.formControl);
}