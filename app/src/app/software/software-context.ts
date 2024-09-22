
import { filter, first, map, merge } from "rxjs";
import { Injectable, Provider, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ModelContext, provideModelContextFromRoute } from "../common/model/context";
import { Software, SoftwareService } from "./software";


@Injectable()
export class SoftwareContext extends ModelContext<Software, SoftwareService> {
}

export function provideSoftwareContext(isOptionalParam: boolean = false) {
    return provideModelContextFromRoute(
        SoftwareService,
        SoftwareContext,
        'software',
        isOptionalParam
    );
}
