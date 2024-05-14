import { Injectable, inject } from "@angular/core";
import { Software, SoftwareQuery, SoftwareService } from "./software";
import { ModelContext } from "../common/model/context";
import { ModelQuery } from "../common/model/model";
import { ModelService } from "../common/model/model-service";


@Injectable()
export class SoftwareContext extends ModelContext<Software> {
    override readonly service = inject(SoftwareService);
}