import { Component, Directive, EventEmitter, Output, inject } from "@angular/core";
import { Resource, ResourceParams, ResourcePatch, ResourceService } from "./resource";
import { FormGroup } from "@angular/forms";
import { ResourceContext } from "./resource-context";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, NEVER, Observable, combineLatest, filter, first, firstValueFrom, map, shareReplay, switchMap, take, tap, withLatestFrom } from "rxjs";
import { ResourceType } from "./resource-type";

@Directive()
export abstract class ResourceFormComponent<T extends Resource, TForm extends FormGroup<any>, TPatch extends ResourcePatch<T>> {
    abstract readonly resourceType: ResourceType & T[ 'type' ];
    readonly context: ResourceContext<T> = inject(ResourceContext<T>)
    abstract readonly service: ResourceService<T, TPatch>;

    readonly initial: Promise<T | null> = firstValueFrom(this.context.committed$);

    readonly resourceIndex$ = this.context.committed$.pipe(
        map(committed => committed ? committed.index : 'create')
    );

    readonly _formSubject = new BehaviorSubject<TForm | null>(null);
    get form(): TForm | null {
        return this._formSubject.value;
    }

    abstract createForm(committed: T | null): TForm;
    abstract patchFromFormValue(form: TForm[ 'value' ]): Partial<TPatch>;

    @Output()
    patchChange = new EventEmitter<Partial<TPatch>>();

    @Output()
    hasError: Observable<boolean> = this._formSubject.pipe(
        takeUntilDestroyed(),
        switchMap(form => form?.statusChanges || NEVER),
        tap((form) => {
            console.log('form valid', form);
        }),
        map(status => status === 'VALID')
    )

    constructor() {
        this.initial.then(committed => this._formSubject.next(this.createForm(committed)));
    }

    ngOnDestroy() {
        this._formSubject.complete();
    }
}