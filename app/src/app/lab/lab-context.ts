import { Injectable, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { Lab } from "./lab";
import { ModelPatch } from "src/app/common/model/model";
import { Observable, of } from "rxjs";

@Injectable()
export class LabContext extends ModelContext<Lab> {
    override _doUpdate(id: string, patch: ModelPatch<Lab>): Promise<Lab> {
        throw new Error("Method not implemented.");
    }
}

export function injectMaybeLabFromContext(): Observable<Lab | null> {
    const labContext = inject(LabContext, { optional: true });

    if (labContext) {
        return labContext.committed$;
    } else {
        return of(null);
    }
}