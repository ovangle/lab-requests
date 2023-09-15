import { Component, ContentChild, ContentChildren, DestroyRef, Inject, Injectable, InjectionToken, Input, QueryList, ViewChild, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Resource, ResourceContext, ResourcePatch, ResourceType, resourceTypeName } from "./resource";
import { FormArray, FormControlDirective, FormControlName, FormGroup, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, Connectable, Observable, Subject, Subscription, combineLatest, connect, connectable, map, takeUntil, tap } from "rxjs";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ResourceContainer } from "../resource-container";
import { isThisWeek } from "date-fns";
import { ResourceContainerFormService } from "../resource-container-form";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";

export const RESOURCE_TYPE = new InjectionToken<ResourceType>('RESOURCE_TYPE');
export const RESOURCE_FORM_FACTORY = new InjectionToken<() => FormGroup<any>>('RESOURCE_FORM_FACTORY');


@Injectable()
export class ResourceFormService<T extends Resource, TPatch extends ResourcePatch = ResourcePatch> {
    readonly resourceContext = inject(ResourceContext<T, TPatch>);
    readonly resourceType = inject(RESOURCE_TYPE);

    readonly containerFormService = inject(ResourceContainerFormService);

    readonly _typeIndexSubject = new BehaviorSubject<[ResourceType, number | 'create'] | undefined>(undefined);
    get _typeIndex(): [ResourceType, number | 'create'] {
        if (this._typeIndexSubject.value === undefined) {
            throw new Error('Cannot access type and index.');
        }
        return this._typeIndexSubject.value;
    }

    get form(): FormGroup<any> | null {
        const [resourceType, index] = this._typeIndex;
        return this.containerFormService.getResourceForm(resourceType, index);
    }

    get isCreate(): boolean {
        const [resourceType, index] = this._typeIndex;
        return index === 'create';
    }

    async commitForm(): Promise<T> {
        const [resourceType, index] = this._typeIndex;
        const container: ResourceContainer = await this.containerFormService.commit();
        if (index === 'create') {
            const resources = container.getResources<T>(resourceType);
            return resources[resources.length - 1];
        }
        return container.getResourceAt<T>(resourceType, index );
    }

    resetForm() {
        this.form?.reset();
    }

    connectToContext(): Subscription {
        const syncTypeIndexSubscription = this.resourceContext.committedTypeIndex$.subscribe(
            (typeIndex) => this._typeIndexSubject.next(typeIndex)
        );
        return new Subscription(() => {
            syncTypeIndexSubscription.unsubscribe();
            this._typeIndexSubject.complete();
        });
    }
}

@Component({
    selector: 'lab-generic-resource-form',
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
                <ng-container *ngIf="isCreate; else updateTitle">Add</ng-container>
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
    protected _formServiceConnection: Subscription;

    readonly _formPane = inject(ExperimentalPlanFormPaneControlService);

    readonly resourceType = inject(RESOURCE_TYPE);

    get form(): F | null {
        return this.resourceFormService.form as F | null;
    }

    get isCreate(): boolean {
        return this.resourceFormService.isCreate;
    }

    ngOnInit() {
        this._resourceContainerFormServiceConnection = this.resourceContainerFormService.connect();
        this._formServiceConnection = this.resourceFormService.connectToContext();
        this.bodyScrollbarHiding.hideScrollbar();
    }

    ngOnDestroy() {
        this._resourceContainerFormServiceConnection.unsubscribe();
        this._formServiceConnection.unsubscribe();
        this.bodyScrollbarHiding.unhideScrollbar();
    }

    saveAndClose() {
        this.resourceFormService.commitForm();
        this._close();
    }

    cancelAndClose() {
        this.resourceFormService.resetForm();
        this._close();
    }

    _close() {
        this._formPane.close();
    }

    _resourceTypeName(r: ResourceType): string {
        return resourceTypeName(r);
    }
}

