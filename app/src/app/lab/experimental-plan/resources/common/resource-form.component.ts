import { Component, ContentChild, ContentChildren, DestroyRef, Inject, Injectable, InjectionToken, Input, QueryList, ViewChild, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Resource, ResourceType, resourceTypeName } from "./resource";
import { FormArray, FormControlDirective, FormControlName, FormGroup, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { ExperimentalPlanModelService } from "../../experimental-plan/experimental-plan";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, Connectable, Observable, Subject, Subscription, combineLatest, connect, connectable, map, takeUntil, tap } from "rxjs";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ResourceContainer, ResourceContainerForm, ResourceContainerFormService } from "../resource-container";
import { isThisWeek } from "date-fns";
import { WorkUnit } from "../../experimental-plan/work-unit/work-unit";

export const RESOURCE_TYPE = new InjectionToken<ResourceType>('RESOURCE_TYPE');
export const RESOURCE_FORM_FACTORY = new InjectionToken<() => FormGroup<any>>('RESOURCE_FORM_FACTORY');

@Injectable()
export class ResourceFormService<T extends Resource, F extends FormGroup<any>> {
    readonly resourceContainerService = inject(ResourceContainerFormService);
    readonly resourceType = inject(RESOURCE_TYPE);
    readonly createEmptyForm = inject<() => F>(RESOURCE_FORM_FACTORY);

    readonly activatedRoute = inject(ActivatedRoute);

    readonly isCreateForm$ = this.activatedRoute.url.pipe(
        map(segments => {
            return segments.some(s => s.path.includes('create'));
        })
    );

    readonly _resourceIndexSubject = new BehaviorSubject(-1);
    readonly resourceIndex$ = connectable(
        combineLatest([
            this.isCreateForm$,
            this.activatedRoute.paramMap
        ]).pipe(
            map(([isCreateForm, paramMap]) => {
                const formIndex = isCreateForm
                    ? this.getResourceFormArray().length
                    : Number.parseInt(paramMap.get('index')!);
                if (Number.isNaN(formIndex)) {
                    throw new Error('Expected index in update form path');
                }
                return [isCreateForm, formIndex] as [boolean, number];
            }),
            tap(([isCreateForm, _]) => {
                if (isCreateForm) {
                    const formArray = this.getResourceFormArray();
                    formArray.push(this.createEmptyForm());
                }
            }),
            map(([_, formIndex]) => formIndex)
        ),
        {
            connector: () => this._resourceIndexSubject
        }
    )

    get resourceIndex(): number {
        return this._resourceIndexSubject.value;
    }

    connect(): Subscription {
        return this.resourceIndex$.connect();
    }

    getResourceFormArray(): FormArray<F> {
        return this.resourceContainerService.getResourceFormArray(this.resourceType);
    }

    getResourceForm(): F {
        return this.resourceContainerService.getResourceForm(this.resourceType, this.resourceIndex) as F;
    }

    commitForm() {
        return this.resourceContainerService.commitResourceFormAt(this.resourceType, this.resourceIndex);
    }

    revertForm() {
        return this.resourceContainerService.revertResourceFormAt(this.resourceType, this.resourceIndex);
    }
}

@Component({
    selector: 'lab-req-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule
    ],
    template: `
        <div class="form-title">
            <h2>
                <ng-container *ngIf="isCreateResourceForm$ | async; else updateTitle">Add</ng-container>
                <ng-template #updateTitle>Update</ng-template>
                {{_resourceTypeName(resourceType).toLocaleLowerCase()}}
            </h2>

            <div class="form-actions">
                <button mat-icon-button
                        [disabled]="form?.invalid"
                        (click)="saveAndClose()">
                    <mat-icon>save</mat-icon>
                </button>
                <button mat-icon-button (click)="cancelAndClose()">
                    <mat-icon>cancel</mat-icon>
                </button>
            </div>
        </div>

        <ng-content></ng-content>
    `,
    host: {
        'class': 'mat-elevation-z8'
    },
    styles: [`
    :host {
        display: block;
        padding: 1em 1.5em;
        width: 40vw;
        min-height: 100%;
        box-sizing: border-box;
    }

    :host ::ng-deep mat-form-field {
        width: 100%;
    }

    .form-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .form-title h2 {
        margin-bottom: 0;
    }
    `],
    providers: [
        ResourceFormService
    ]

})
export class ResourceFormComponent<T extends Resource, F extends FormGroup<any>> {
    private readonly _destroyRef = inject(DestroyRef);

    readonly bodyScrollbarHiding = inject(BodyScrollbarHidingService);
    readonly router = inject(Router);
    readonly route = inject(ActivatedRoute);

    readonly resourceContainerFormService = inject(ResourceContainerFormService);
    protected _resourceContainerFormServiceConnection: Subscription;
    readonly resourceFormService = inject(ResourceFormService<T, F>);
    protected _resourceFormServiceConnection: Subscription;

    readonly resourceType = inject(RESOURCE_TYPE);

    readonly isCreateResourceForm$ = this.resourceFormService.isCreateForm$;

    get form(): F | null {
        return this.resourceFormService.getResourceForm();
    }

    ngOnInit() {
        this._resourceContainerFormServiceConnection = this.resourceContainerFormService.connect();
        this._resourceFormServiceConnection = this.resourceFormService.connect();
        this.bodyScrollbarHiding.hideScrollbar();
    }

    ngOnDestroy() {
        this._resourceContainerFormServiceConnection.unsubscribe();
        this._resourceFormServiceConnection.unsubscribe();
        this.bodyScrollbarHiding.unhideScrollbar();
    }

    saveAndClose() {
        this.resourceFormService.commitForm();
        this._close();
    }

    cancelAndClose() {
        this.resourceFormService.revertForm();
        this._close();
    }

    _close() {
        this.router.navigate(
            ['./', { outlets: { form: null } }],
            { relativeTo: this.route.parent }
        );
    }

    _resourceTypeName(r: ResourceType): string {
        return resourceTypeName(r);
    }
}

