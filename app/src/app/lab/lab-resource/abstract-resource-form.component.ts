import { Component, Directive, EventEmitter, Output, inject } from "@angular/core";
import { Resource, ResourceParams, ResourcePatch, ResourceService } from "./resource";
import { FormGroup } from "@angular/forms";
import { ResourceContext } from "./resource-context";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, NEVER, Observable, combineLatest, filter, first, firstValueFrom, map, shareReplay, switchMap, take, tap, withLatestFrom } from "rxjs";
import { ResourceType } from "./resource-type";

@Directive()
export abstract class ResourceFormComponent<T extends Resource, TForm extends FormGroup<any>, TPatch extends ResourcePatch> {
    abstract readonly resourceType: ResourceType & T[ 'type' ];
    readonly context: ResourceContext<T, TPatch> = inject(ResourceContext<T, TPatch>)
    abstract readonly service: ResourceService<T, TPatch>;

    readonly initial: Promise<T | null> = firstValueFrom(this.context.maybeCommitted$);
    readonly resourceIndex$ = this.context.resourceIndex$;
    readonly _formSubject = new BehaviorSubject<TForm | null>(null);
    readonly form$ = this._formSubject.pipe(
        filter((form): form is TForm => form != null)
    );

    get form(): TForm | null {
        return this._formSubject.value;
    }

    abstract createForm(committed: T | null): TForm;
    abstract patchFromFormValue(form: TForm[ 'value' ]): Promise<TPatch>;

    @Output()
    save = new EventEmitter<T>();

    @Output()
    requestClose = new EventEmitter<string>();

    constructor() {
        this.initial.then(committed => this._formSubject.next(this.createForm(committed)));
    }

    ngOnDestroy() {
        this._formSubject.complete();
    }

    async saveAndClose() {
        if (!(this.form && this.form.valid)) {
            throw new Error('Invalid form has no patch');
        }
        const patch = await this.patchFromFormValue(this.form.value);
        const saved = await this.context.save(patch);
        this.save.next(saved);
        this.close('saved');
    }

    close(reason: string) {
        this.requestClose.emit(reason);
    }
}