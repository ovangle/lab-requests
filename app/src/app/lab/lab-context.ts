import { Directive, EmbeddedViewRef, HostBinding, Injectable, Injector, Input, TemplateRef, ViewContainerRef, inject } from "@angular/core";
import { AbstractModelContextDirective, ModelContext } from "src/app/common/model/context";
import { Lab, LabService } from "./lab";
import { Observable, of } from "rxjs";

@Injectable()
export class LabContext extends ModelContext<Lab> {
    override readonly service = inject(LabService);
}

export function injectMaybeLabFromContext(): Observable<Lab | null> {
    const labContext = inject(LabContext, { optional: true });

    if (labContext) {
        return labContext.committed$;
    } else {
        return of(null);
    }
}

@Directive({
    selector: 'ng-template[labContext]',
    standalone: true,
})
export class LabContextDirective extends AbstractModelContextDirective<Lab> {
    constructor() {
        super(LabContext);
    }

    @Input({ required: true })
    get labContext(): Lab | null {
        return this.modelSubject.value;
    }
    set labContext(lab: Lab | null) {
        this.modelSubject.next(lab);
    }

}