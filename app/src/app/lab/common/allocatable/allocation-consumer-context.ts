import { inject, Injectable } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { LabAllocationConsumer, LabAllocationConsumerService } from "./lab-allocation-consumer";


@Injectable()
export class LabAllocationConsumerContext extends ModelContext<LabAllocationConsumer> {
    readonly service = inject(LabAllocationConsumerService);

}