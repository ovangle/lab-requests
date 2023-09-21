import { CommonModule } from "@angular/common";
import { Component, Injectable, Input, inject } from "@angular/core";
import { ControlContainer, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { FundingModel, FundingModelContext, FundingModelCreate, FundingModelPatch, FundingModelService } from "./funding-model";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, EMPTY, NEVER, Observable, Subject, Subscription, combineLatest, defer, firstValueFrom, map, never, of, shareReplay, startWith, switchMap } from "rxjs";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { FundingModelFormComponent } from "./funding-model-form.component";
import { LayoutSplitViewComponent } from "src/app/utils/layout/split-view.component";

@Injectable()
export class FundingModelSelectContext extends FundingModelContext {
    // Value actually selected in the subject
    readonly inputSubject = new Subject<FundingModel | 'other' | null>();
    readonly toCreateSubject = new Subject<FundingModelCreate>();

    readonly fundingModel$: Observable<FundingModel | FundingModelCreate | null> = defer(
        () => this.inputSubject.pipe(
            switchMap(value => {
                if (value === 'other') {
                    return this.toCreateSubject;
                }
                return of(value);
            })
        )
    );

    override _doCreate(patch: FundingModelCreate): Observable<FundingModel> {
        // Inside the select context, we override the creation process to merely
        // overwrite the toCreatek value, bystepping the API. 
        // This allows the containing form to submit requests on our behalf.
        this.toCreateSubject.next(patch);
        return NEVER;
    }

    override _doCommit(id: string, patch: FundingModelPatch): Observable<FundingModel> {
        // You cannot patch via a FundingModelSelect context.
        throw new Error('not implemented');
        return NEVER;
    }

    override sendCommitted(input: Observable<FundingModel | 'other' | null>): Subscription {
        const sSubscription = super.sendCommitted(of(null));
        input.subscribe(this.inputSubject);

        // TODO: Remove me.
        this.committed$.subscribe(committed => {
            if (committed != null) {
                throw new Error('Shoud not commit')
            }
        })

        return new Subscription(()=> {
            sSubscription.unsubscribe();
            this.inputSubject.complete();
            this.toCreateSubject.complete();
        })
    }
}


@Component({
    selector: 'uni-research-funding-model-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,

        LayoutSplitViewComponent,
        SelectOtherDescriptionComponent,
        FundingModelFormComponent
    ],
    template: `
    <app-layout-split-view [rightPaneVisible]="isOtherSelected$ | async">
        <section id="left-pane">
            <mat-form-field>
                <mat-label>
                    <ng-content select="mat-label"></ng-content>
                </mat-label>
                <mat-select [formControl]="selectedControl" [required]="required" 
                            (selectionChange)="_onTouched()">
                    <mat-option *ngFor="let option of (options$ | async)" [value]="option">
                        {{option.description}}
                    </mat-option>
                    <mat-option value="other">Other...</mat-option>
                </mat-select>

                <mat-error>
                    <ng-content select="mat-error"></ng-content>
                </mat-error>
            </mat-form-field>
        </section>

        <section id="right-pane">
            <uni-research-funding-model-form
                [disabled]="selectedControl.disabled">
            </uni-research-funding-model-form>
        </section>
    </app-layout-split-view>

        <!--
        <lab-req-select-other-description
            [isOtherSelected]="isOtherSelected$ | async"
            formControlName="otherDescription">
        </lab-req-select-other-description>
        -->
    `,
    styles: [`
    section[id=right-pane] {
        padding-left: 1em;
        box-sizing: border-box;
    }
    `],
    providers: [
        {
            provide: FundingModelContext,
            useClass: FundingModelSelectContext
        },
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: FundingModelSelectComponent
        }
    ]
})
export class FundingModelSelectComponent implements ControlValueAccessor {
    controlContainer = inject(ControlContainer);
    _models = inject(FundingModelService);
    _fundingModelContext = inject(FundingModelContext) 
    _fundingModelContextConnection: Subscription;

    readonly selectedControl = new FormControl<FundingModel | 'other' | null>(null);
    readonly isOtherSelected$ = this.selectedControl.valueChanges.pipe(
        map(value => value === 'other')
    );

    readonly valueSubject = (this._fundingModelContext as FundingModelSelectContext).fundingModel$;

    readonly options$: Observable<FundingModel[]> = this._models.search('')

    constructor() {
        // Connect to the funding model with the 
        this._fundingModelContextConnection = this._fundingModelContext.sendCommitted(
            this.selectedControl.valueChanges.pipe(
                map(value => value === 'other' ? null : value)
            )
        );
    }

    ngOnDestroy() {
        this._fundingModelContextConnection.unsubscribe();
        this._onChangeSubscriptions.forEach(s => s.unsubscribe());
    }

    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
    }
    private _required = false;

    writeValue(value: FundingModel | FundingModelCreate | null): void {
        if (value instanceof FundingModel || value == null) {
            this.selectedControl.setValue(value);
        } else {
            this.selectedControl.setValue('other');
            (this._fundingModelContext as FundingModelSelectContext).toCreateSubject.next(value);
        }
    }

    _onChangeSubscriptions: Subscription[] = [];
    registerOnChange(fn: (value: FundingModel | FundingModelCreate | null) => void): void {
        this._onChangeSubscriptions.push(this.valueSubject.subscribe(fn));
    }
    _onTouched = () => {}
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this.selectedControl);
}