import { Directive, EventEmitter, Output, inject } from "@angular/core";
import { AbstractControl, ControlContainer, FormControlStatus, FormGroup } from "@angular/forms";
import { Subscription } from "rxjs";
import { AnonymousSubject } from "rxjs/internal/Subject";

/**
 * Represents a directive which can either be included as a standalone form
 */
@Directive()
export abstract class NestableFormDirective<TForm extends FormGroup<any>> {
    readonly _controlContainer = inject(ControlContainer, { optional: true });

    get isStandaloneForm() {
        return this._controlContainer && this._controlContainer.control != null;
    }
    abstract _isNestedFormGroupInstance(control: AbstractControl<any, any> | null): control is TForm;
    abstract _newStandaloneForm(): TForm;
    abstract _onStandaloneFormSubmit(value: TForm[ 'value' ]): any;

    get form(): TForm {
        if (this._form === undefined) {
            if (this._controlContainer) {
                if (!this._isNestedFormGroupInstance(this._controlContainer.control)) {
                    throw new Error('Control container must contain a control recognised by this directive');
                }
                this._form = this._controlContainer.control;
            } else {
                this._form = this._newStandaloneForm();
            }
        }
        return this._form;
    }
    private _form: TForm | undefined;

    @Output()
    formSave = new EventEmitter<ReturnType<this[ '_onStandaloneFormSubmit' ]>>();

    @Output()
    formStatus = new EventEmitter<FormControlStatus>();
    private _formStatusSubscription: Subscription | undefined;

    ngOnInit() {
        this._formStatusSubscription = this.form.statusChanges.subscribe(this.formStatus);
    }

    ngOnDestroy() {
        this._formStatusSubscription!.unsubscribe();
    }

}