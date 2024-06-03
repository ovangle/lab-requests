import { Injectable, Provider, Type } from "@angular/core";
import { Installable } from "./installable";
import { LabInstallation, LabInstallationQuery } from "./installation";
import { ModelIndex } from "src/app/common/model/model-index";


@Injectable()
export abstract class LabInstallationIndex<
    TInstallable extends Installable<TInstallation>,
    TInstallation extends LabInstallation<TInstallable, any>,
    TQuery extends LabInstallationQuery<TInstallable, TInstallation>
> extends ModelIndex<TInstallation, TQuery> {

}

export function provideLabInstallationIndex(
    impl: Type<LabInstallationIndex<any, any, any>>
): Provider {
    return {
        provide: LabInstallationIndex,
        useExisting: impl
    };
}