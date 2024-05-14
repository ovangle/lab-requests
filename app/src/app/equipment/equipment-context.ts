import { Directive, Injectable, Input, Provider, inject } from "@angular/core";
import { AbstractModelContextDirective, ModelContext } from "src/app/common/model/context";
import { Equipment, EquipmentService } from "./equipment";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";


@Injectable()
export class EquipmentContext extends ModelContext<Equipment> {
    override readonly service = inject(EquipmentService);
}

function equipmentIndexFromRoot(route: ActivatedRoute): ActivatedRoute | undefined {
    for (const child of route.children) {
        if (child.routeConfig?.path === 'equipment') {
            return child;
        }
        const indexFromChild = equipmentIndexFromRoot(child);
        if (indexFromChild !== undefined) {
            return indexFromChild;
        }
    }
    return undefined;
}

export function provideEquipmentDetailRouteContext(): Provider {
    return {
        provide: EquipmentContext,
        useFactory: (rootRoute: ActivatedRoute) => {
            const context = new EquipmentContext();

            const equipmentIndexRoute = equipmentIndexFromRoot(rootRoute);
            if (equipmentIndexRoute === undefined) {
                throw new Error('Could not locate equipment index in route tree');
            }
            let equipmentId: string | null = null;
            for (const child of equipmentIndexRoute.children) {
                equipmentId ||= child.snapshot.paramMap.get('equipment_id');
            }
            if (equipmentId === null) {
                throw new Error('No equipment_id found in equipment params')
            }
            context.sendCommittedId(of(equipmentId));
            return context;
        },
        deps: [ ActivatedRoute ]
    }
}

@Directive({
    selector: 'ng-template[equipmentContext]',
    standalone: true,
})
export class EquipmentContextDirective extends AbstractModelContextDirective<Equipment> {
    constructor() {
        super(EquipmentContext);
    }

    @Input()
    get equipmentContext() {
        return this.modelSubject.value;
    }
    set equipmentContext(value: Equipment | null) {
        this.modelSubject.next(value);
    }
}