import { Component, DestroyRef, EventEmitter, HostBinding, Output, inject } from "@angular/core"
import { ScaffoldFormPaneControl, ScaffoldFormPane } from "./form-pane-control";
import { BehaviorSubject } from "rxjs";
import { CommonModule } from "@angular/common";
import { UrlSegment } from "@angular/router";

export class ScaffoldFormPaneActivation {
  constructor(
    readonly formUrl: readonly UrlSegment[]
  ) { }
}

export class ScaffoldFormPaneDeactivation {

}

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

  @Output()
  activate = new EventEmitter<ScaffoldFormPaneActivation>();

  @Output()
  deactivate = new EventEmitter<ScaffoldFormPaneDeactivation>();

  toggleIsOpen(formUrl: readonly UrlSegment[] | null) {
    this.isOpen = formUrl != null;

    if (formUrl) {
      this.activate.emit(new ScaffoldFormPaneActivation(formUrl));
    } else {
      this.deactivate.emit(new ScaffoldFormPaneDeactivation());
    }

  }

  ngOnInit() {
    const controlConnection = this._control.connect(this);

    this._destroyRef.onDestroy(() => {
      controlConnection.unsubscribe();
    })
  }
}


// <p>@{outputs('Get_an_@mention_token_for_a_user')?['body/atMention']}</p><br><p>A new lab request has been submitted by @{outputs('Get_user_profile_(V2)')?['body/displayName']} (@{outputs('Get_user_profile_(V2)')?['body/mail']}).<br><br><br><br><a href="">view submission</a><br><a href="">view task</a></p>