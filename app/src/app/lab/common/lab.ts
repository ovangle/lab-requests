import { Campus } from "src/app/uni/campus/common/campus";
import { LabType } from "../type/lab-type";


export interface Lab {
    readonly id: string;
    readonly type: LabType;
    readonly campus: Campus;

    readonly technicians: string[];
}