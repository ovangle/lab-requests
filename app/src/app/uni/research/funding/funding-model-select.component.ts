import { Component, inject } from "@angular/core";
import { ActorContext } from "src/app/actor/actor";
import { FundingModel } from "./funding-model";
import { Observable } from "rxjs";


@Component({
    selector: 'uni-funding-model-select',
    standalone: true,
    imports: [],
    template: `
    `,
    providers: [
        FundingModelCollection
    ]
})
export class FundingModelSelect {
    readonly _actorContext = inject(ActorContext);

    readonly options$: Observable<FundingModel[]>;
    
}