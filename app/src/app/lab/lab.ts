import { Campus } from "../uni/campus/campus";
import { LabType } from "./type/lab-type";


export interface Lab {
    readonly type: LabType;
    readonly campus: Campus;

    readonly technicians: string[];
}