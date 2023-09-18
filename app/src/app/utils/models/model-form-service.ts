import { Injectable } from "@angular/core";
import { Model, ModelService } from "./model-service";
import { Context } from "./model-context";
import { defer, filter, firstValueFrom, map } from "rxjs";
import { FormGroup } from "@angular/forms";


@Injectable()
export abstract class ModelFormService<T extends Model, TPatch, TForm extends FormGroup<any> = FormGroup<any>> {
    abstract readonly models: ModelService<T, TPatch>;
    abstract readonly context: Context<T, TPatch>;

    readonly committed$ = defer(() => this.context.committed$);
    readonly isCreate$ = defer(() => this.committed$.pipe(map(c => c == null)));

    abstract readonly form: TForm;
    abstract _patchFromFormValue(value: TForm['value']): TPatch;

    readonly patch$ = defer(() => this.form.valueChanges.pipe(
        filter(() => this.form.valid),
        map(value => this._patchFromFormValue(value))
    ));

    async save() {
        if (!this.form.valid) {
            throw new Error('Cannot save invalid form');
        }
        const isCreate = await firstValueFrom(this.isCreate$);
        const patch = await firstValueFrom(this.patch$);

        if (isCreate) {
            return await this.context.create(patch);
        } else {
            return await this.context.commit(patch);
        }
    }
}