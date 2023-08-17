import { Component, ContentChild, ContentChildren, DestroyRef, Inject, Injectable, InjectionToken, Input, QueryList, ViewChild, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Resource, ResourceType, resourceTypeName } from "./resource";
import { FormArray, FormControlDirective, FormControlName, FormGroup, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { ExperimentalPlanService } from "../../experimental-plan/experimental-plan";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, Subject, combineLatest, map, takeUntil, tap } from "rxjs";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";

export const RESOURCE_TYPE = new InjectionToken<ResourceType>('RESOURCE_TYPE');

@Injectable()
export class ResourceFormService<T extends Resource, F extends FormGroup<any>> {
    readonly planService = inject(ExperimentalPlanService);
    readonly resourceType = inject(RESOURCE_TYPE);

    get formArray(): FormArray<F> {
        return this.planService.getResourceFormArray(this.resourceType) as FormArray<F>;
    }

    getResourceForm(index: number): F {
        return this.planService.getResourceForm(this.resourceType, index) as F;
    }

    commitFormAt(index: number) {
        return this.planService.commitResourceFormAt(this.resourceType, index);
    }

    revertFormAt(index: number) {
        return this.planService.revertResourceFormAt(this.resourceType, index);
    }

    pushCreateResourceForm() {
        return this.planService.pushCreateResourceForm(this.resourceType);
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
    providers: [
        ResourceFormService
    ],
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
    `]
})
export class ResourceFormComponent<T extends Resource, F extends FormGroup<any>> {
    private readonly _destroyRef = inject(DestroyRef);

    readonly bodyScrollbarHiding = inject(BodyScrollbarHidingService);
    readonly router = inject(Router);
    readonly route = inject(ActivatedRoute);
    readonly formService: ResourceFormService<T, F> = inject(ResourceFormService<T, F>);

    readonly resourceType = inject(RESOURCE_TYPE);

    readonly isCreateResourceForm$ = this.route.url.pipe(
        map(segments => {
            if (!segments.some(s => s.path.includes(this.resourceType))) {
                throw new Error('Path for resource form must include resource type');
            }
            return segments.some(s => s.path.includes('create'));
        })
    );

    readonly formIndexSubject = new BehaviorSubject<number>(-1);
    get formIndex(): number {
        return this.formIndexSubject.value;
    }
    get form(): F | null {
        return this.formService.getResourceForm(this.formIndex);
    }

    readonly formIndex$ = combineLatest([this.isCreateResourceForm$, this.route.paramMap]).pipe(
        takeUntilDestroyed(),
        map(([isCreateForm, paramMap]) => {
            if (isCreateForm) {
                if (paramMap.get('index') !== null) {
                    throw new Error('Resource create path cannot include :index param');
                }
                return this.formService.formArray.length;
            } else {
                const formIndex = paramMap.get('index');
                if (formIndex === null) {
                    throw new Error('Resource update path must include :index param');
                }
                return Number.parseInt(formIndex);
            }
        }),
        tap((formIndex) => {
            if (formIndex === this.formService.formArray.length) {
                this.formService.pushCreateResourceForm();
            }
        })
    )

    ngOnInit() {
        this.formIndex$.subscribe(this.formIndexSubject);
        this.bodyScrollbarHiding.hideScrollbar();
    }

    ngOnDestroy() {
        this.bodyScrollbarHiding.unhideScrollbar();
    }

    saveAndClose() {
        this.formService.commitFormAt(this.formIndex);
        this._close();
    }

    cancelAndClose() {
        this.formService.revertFormAt(this.formIndex);
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

