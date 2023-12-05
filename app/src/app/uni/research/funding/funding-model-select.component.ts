import { Component, OnInit, inject } from "@angular/core";
import { FUNDING_MODEL_NAMES, FundingModel, FundingModelCollection } from "./funding-model";
import { Observable } from "rxjs";
import { injectModelQuery } from "src/app/common/model/model-collection";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { UserContext } from "src/app/user/user-context";


@Component({
    selector: 'uni-research-funding-model-select',
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
            @if (options$ | async; as options) {
                @for (option of options; track option) {
                    {{option.name}}
                }
            }
        </mat-select>
    </mat-form-field>
    `,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: FundingModelSelectComponent}
    ]
})
export class FundingModelSelectComponent implements ControlValueAccessor {
    
    readonly userContext = inject(UserContext);

    readonly collection = inject(FundingModelCollection);
    readonly options$ = this.collection.pageItems$;

    ngOnInit() {
        this.collection.setLookup({name_eq: FUNDING_MODEL_NAMES});
    }

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