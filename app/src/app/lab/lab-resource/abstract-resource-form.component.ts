import { Component, Directive, EventEmitter, Output, inject } from "@angular/core";
import { Resource, ResourceParams } from "./resource";
import { FormGroup } from "@angular/forms";
import { ResourceContext } from "./resource-context";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, Observable, combineLatest, filter, first, firstValueFrom, map, shareReplay, switchMap, take, withLatestFrom } from "rxjs";

function patchParams(committed: Resource | null): ResourceParams {
    return {
        id: committed?.id || null,
        index: committed?.index || 'create',
    }
}

@Directive()
export abstract class ResourceFormComponent<T extends Resource, TForm extends FormGroup<any>> {
    readonly context = inject(ResourceContext<T>)

    readonly initial: Promise<T> = firstValueFrom(this.context.committed$);

    readonly _formSubject = new BehaviorSubject<TForm | null>(null);
    get form(): TForm | null {
        return this._formSubject.value;
    }

    abstract createForm(committed: T | null): TForm;
    abstract getPatch(baseParams: ResourceParams, value: TForm['value']): Promise<T>;

    @Output()
    patchChange = this._formSubject.pipe(
        takeUntilDestroyed(),
        filter((f): f is TForm => f != null),
        switchMap(f => combineLatest([f.statusChanges, f.valueChanges])),
        filter(([status]) => status === 'VALID'),
        map(([_, value]) => value as TForm['value']),
        withLatestFrom(this.initial),
        switchMap(([value, committed]) => this.getPatch(patchParams(committed), value))
    );

    @Output()
    hasError: Observable<boolean> = this._formSubject.pipe(
        takeUntilDestroyed(),
        map(form => !!form && form.valid)
    )

    constructor() {
        this.initial.then(committed => this._formSubject.next(this.createForm(committed)));
    }

    ngOnDestroy() {
        this._formSubject.complete();
    }
}