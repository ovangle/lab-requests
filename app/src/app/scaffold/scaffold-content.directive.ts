import { Directive, Input } from "@angular/core";

export type ScaffoldContentLayoutType
  = 'full-width'
  | 'centered'
  | 'none';


@Directive({
  selector: 'scaffoldContentLayout',
  standalone: true,
  host: {
    '[class.scaffold-content-full-width]': 'contentLayout === full-width',
    '[class.scaffold-content-centered]': 'contentLayout === centered'
  },
})
export class ScaffoldContentLayout {
}