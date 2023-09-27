import {Actor} from '../actor';

import type { Campus } from 'src/app/uni/campus/campus';

export interface LabTechnician extends Actor {
    readonly campus: Campus;
}