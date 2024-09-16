import { LabAllocation } from "src/app/lab/common/allocatable/lab-allocation";
import { JsonObject } from "src/app/utils/is-json-object";

import { SoftwareInstallation } from "../installation/software-installation";


export class SoftwareLease extends LabAllocation<SoftwareInstallation> {
    constructor(json: JsonObject) {
        super(json);
    }
}