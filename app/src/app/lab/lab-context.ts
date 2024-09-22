import { Directive, EmbeddedViewRef, HostBinding, Injectable, Injector, Input, TemplateRef, ViewContainerRef, inject } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { Lab, LabService } from "./lab";
import { Observable, of } from "rxjs";

@Injectable()
export class LabContext extends ModelContext<Lab, LabService> {
}

export function provideLabContextFromRoute(isOptionalParam: boolean = false) {
    return provideModelContextFromRoute(
        LabService,
        LabContext,
        'lab',
        isOptionalParam
    );
}