import { Injectable, inject } from "@angular/core";
import { Resource, ResourceContext, ResourcePatch, ResourceType, isResourceType } from "./resource";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Observable, Subscription, combineLatest, map } from "rxjs";
import { EquipmentLeaseFormComponent } from "../equipment/equipment-lease-form.component";
import { ServiceResourceFormComponent } from "../service/service-resource-form.component";
import { SoftwareResourceFormComponent } from "../software/software-resource-form.component";
import { OutputMaterialResourceFormComponent } from "../material/output/output-material-resource-form.component";
import { InputMaterialResourceFormComponent } from "../material/input/input-material-resource-form.component";

@Injectable()
export class ResourceFormResourceContext<T extends Resource, TPatch extends ResourcePatch> extends ResourceContext<T, TPatch> {
    readonly activatedRoute = inject(ActivatedRoute);

    readonly resourceType$ = this.activatedRoute.url.pipe(
        map(segments => segments.filter(s => isResourceType(s.path))[0]),
        map(segment => segment.path as ResourceType)
    );

    override readonly indexFromContext$: Observable<number> = combineLatest([
        this.activatedRoute.paramMap
    ]).pipe(
        map()
    );
}

@Component({
    selector: 'app-lab-work-unit-resource-form-host',
    standalone: true,
    imports: [
        CommonModule,
        EquipmentLeaseFormComponent,
        ServiceResourceFormComponent,
        SoftwareResourceFormComponent,

        InputMaterialResourceFormComponent,
        OutputMaterialResourceFormComponent
    ],
    template: `
    <ng-container [ngSwitch]="resourceType$ | async">
        <ng-container *ngSwitchCase="'equipment'">
            <app-lab-equipment-lease-form></app-lab-equipment-lease-form>
        </ng-container>
        <ng-container *ngSwitchCase="'software'">
            <app-lab-software-resource-form></app-lab-software-resource-form>
        </ng-container>
        <ng-container *ngSwitchCase="'service'">
            <app-lab-service-resource-form></app-lab-service-resource-form>
        </ng-container>
        <ng-container *ngSwitchCase="'input-material'">
            <app-lab-input-material-resource-form></app-lab-input-material-resource-form>
        </ng-container>

        <ng-container *ngSwichCase="'output-material'">
            <app-lab-output-material-resource-form></app-lab-output-material-resource-form>
        </ng-container>

    </ng-container>
    `,
    providers: [
        { provide: ResourceContext, useClass: ResourceFormResourceContext }
    ]
})
export class ResourceContextFormHostComponent {
    readonly _context = inject(ResourceFormResourceContext);
    _contextConnection: Subscription;

    readonly resourceType$ = this._context.resourceTypeFromContext$;

    constructor() {
        this._contextConnection = this._context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}