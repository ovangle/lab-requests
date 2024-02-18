import { Directive, Injectable, Input, Provider, inject } from "@angular/core";
import { AbstractModelContextDirective, ModelContext } from "src/app/common/model/context";
import { Equipment, EquipmentService } from "./equipment";
import { ModelPatch } from "src/app/common/model/model";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";


@Injectable()
export class EquipmentContext extends ModelContext<Equipment> {
    override readonly service = inject(EquipmentService);
}

export function provideEquipmentDetailRouteContext(): Provider {
    return {
        provide: EquipmentContext,
        useFactory: (route: ActivatedRoute) => {
            const context = new EquipmentContext();

            const id$ = route.paramMap.pipe(
                map(paramMap => paramMap.get('equipment_id')!)
            );
            context.sendCommittedId(route.paramMap.pipe(
                map(paramMap => paramMap.get('equipment_id')!)
            ));
            return context;
        },
        deps: [ActivatedRoute]
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