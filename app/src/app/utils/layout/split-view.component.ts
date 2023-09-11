import { animate, state, style, transition, trigger } from "@angular/animations";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

/**
 * Splits a view horizontally into left and right panes.
 * 
 * Initially, the left pane takes up 100% of the view.
 * 
 */
@Component({
    selector: 'app-layout-split-view',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    <div class="left-pane">
        <ng-content select="section[id=left-pane]"></ng-content>
    </div>

    <div class="right-pane"
        [@enterFromLeft]="rightPaneVisible ? 'visible' : 'hidden'">
        <ng-content select="section[id=right-pane]"></ng-content>
    </div>
    `,
    styles: [`
    :host {
        display: flex;
    }

    .left-pane {
        flex-basis: 50%;
        flex-grow: 1;
    }
    .right-pane {
        width: 100%;
        overflow: hidden;
    }
    `],
    animations: [
        trigger('enterFromLeft', [
            state('hidden', style({width: '0px', minWidth: 0})),
            state('visible', style({width: '*'})),
            transition('hidden <=> visible', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
        ])
    ]
})
export class LayoutSplitViewComponent {
    @Input()
    get rightPaneVisible(): boolean {
        return this._rightPaneVisible;
    }
    set rightPaneVisible(input: BooleanInput) {
        this._rightPaneVisible = coerceBooleanProperty(input);
    }
    _rightPaneVisible: boolean = false;

}