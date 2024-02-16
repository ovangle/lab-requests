import { Injectable, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { Lab, LabService } from "./lab";
import { ModelPatch } from "src/app/common/model/model";
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