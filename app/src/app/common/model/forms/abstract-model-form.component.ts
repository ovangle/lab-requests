import { Directive, inject, Output, EventEmitter, Component, input } from "@angular/core";
import { FormGroup, ControlContainer } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Directive()
export abstract class AbstractModelForm<TForm extends FormGroup<any>> {
    readonly _controlContainer = inject(ControlContainer, { self: true, optional: true })
    get isContainedForm(): boolean {
        return this._controlContainer == null;
    }

    abstract _createStandaloneForm(): TForm;

    protected _standaloneForm: TForm | undefined;
    get isStandaloneForm(): boolean {
        return this._standaloneForm !== undefined;
    }

    get form(): TForm {
        if (this._controlContainer) {
            return this._controlContainer.control as TForm;
        }
        if (this._standaloneForm === undefined) {
            this._standaloneForm = this._createStandaloneForm();
        }
        return this._standaloneForm;
    }

    @Output()
    submit = new EventEmitter<TForm['value']>()
    onFormSubmit() {
        if (!this.form.valid) {
            throw new Error('Cannot submit invalid form');
        }

        this.submit.next(this.form.value);
    }

    @Output()
    cancel = new EventEmitter<void>();
    onCancel() {
        this.cancel.next(undefined);
    }
}

@Component({
    selector: 'model-form-actions',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule
    ],
    template: `
    @if (modelForm.isStandaloneForm) {
        <button mat-button color="primary"
                [disabled]="!modelForm.form.valid"
                (click)="modelForm.onFormSubmit()">
            <mat-icon>save</mat-icon>SAVE
        </button>

        <button mat-button (click)="modelForm.onCancel()">
            <mat-icon>cancel</mat-icon>CLOSE
        </button>
    }
    `,
    styles: `
    :host {
        display: flex;
        justify-content: right;
    }
    `
})
export class ModelFormActionsComponent {
    readonly modelForm = inject(AbstractModelForm);

}