import { Injectable, inject } from "@angular/core";
import { ModelIndex } from "../common/model/model-index";
import { Software, SoftwareQuery, SoftwareService } from "./software";
import { ParamMap } from "@angular/router";
import { ModelService } from "../common/model/model-service";


@Injectable()
export class SoftwareIndex extends ModelIndex<Software, SoftwareQuery> {
    override readonly service = inject(SoftwareService);
    override _queryFromRouteParams(paramMap: ParamMap): Partial<SoftwareQuery> {
        return {};
    }

}