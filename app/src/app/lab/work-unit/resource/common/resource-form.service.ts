import { Injectable, inject } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { BehaviorSubject, Subscription, tap } from "rxjs";
import { Resource, ResourceContext } from "../resource";
import { ResourceContainerFormService } from "../resource-container-form.service";
import { ResourceType } from "../resource-type";
import { ResourceContainer } from "../resource-container";


@Injectable()
export class ResourceFormService<T extends Resource, TForm extends FormGroup<any>> {
    readonly resourceContext = inject(ResourceContext<T>);
    readonly containerFormService = inject(ResourceContainerFormService);

    readonly _typeIndexSubject = new BehaviorSubject<[ResourceType, number | 'create'] | undefined>(undefined);
    get _typeIndex(): [ResourceType, number | 'create'] {
        if (this._typeIndexSubject.value === undefined) {
            throw new Error('Cannot access type and index.');
        }
        return this._typeIndexSubject.value;
    }

    get form(): TForm {
        const [resourceType, index] = this._typeIndex;
        const form = this.containerFormService.getResourceForm(resourceType, index);
        if (form == null) {
            throw new Error('Resource form not initialized');
        }
        return form as TForm;
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

    connectToContext(): Subscription {
        const syncTypeIndexSubscription = this.resourceContext.committedTypeIndex$.pipe(
            tap(async ([resourceType, index]) => {
                await this.containerFormService.initResourceForm(resourceType, index);
            }),
        ).subscribe((typeIndex) => {
                this._typeIndexSubject.next(typeIndex);
        });

        return new Subscription(() => {
            syncTypeIndexSubscription.unsubscribe();
            this._typeIndexSubject.complete();

            const [resourceType, index] = this._typeIndex;
            return this.containerFormService.clearResourceForm(resourceType, index);

        });
    }
}