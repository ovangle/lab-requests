import { Component, DestroyRef, HostBinding, inject } from "@angular/core"
import { ScaffoldFormPaneControl, ScaffoldFormPane } from "./form-pane-control";
import { BehaviorSubject } from "rxjs";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'scaffold-form-pane',
  standalone: true,
  imports: [ CommonModule ],
  template: `
  <div class="container" [class.visible]="isOpen">
    <div class="sticky-top" >
      <ng-content></ng-content>
    </div>
  </div>
  `,
  styles: `
  .container.visible {
    min-width: 40em;
    padding: 1em 2em;
    box-sizing: border-box;
  }
  .sticky-top {
    width: 100%;
    height: 100vh;
    position: sticky;
    top: 0;
  }
  `
})
export class ScaffoldFormPaneComponent implements ScaffoldFormPane {
  readonly _control = inject(ScaffoldFormPaneControl);
  readonly _destroyRef = inject(DestroyRef);

  @HostBinding('class.open')
  isOpen: boolean = false;

  toggleIsOpen(isOpen: boolean) {
    this.isOpen = isOpen;
  }

  ngOnInit() {
    const controlConnection = this._control.connect(this);

    this._destroyRef.onDestroy(() => {
      controlConnection.unsubscribe();
    })

  }
}

