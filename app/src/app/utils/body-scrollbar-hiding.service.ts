import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';

function injectRenderer(): Renderer2 {
  const rendererFactory = inject(RendererFactory2);
  return rendererFactory.createRenderer(null, null);
}

/**
 * A service that allows hiding the scrollbar on the document body without setting `overflow: hidden`
 *
 * This allow overlay panes to be `position: sticky`, but disallow scrolling of the background window
 *
 */
@Injectable()
export class BodyScrollbarHidingService {
  document = inject(DOCUMENT);
  renderer = injectRenderer();

  get isScrollbarVisible() {
    return !this.document.body.classList.contains('hide-scrollbar');
  }

  hideScrollbar() {
    this.renderer.addClass(this.document.body, 'hide-scrollbar');
  }

  unhideScrollbar() {
    this.renderer.removeClass(this.document.body, 'hide-scrollbar');
  }

  toggleScrollbar(isVisible: boolean) {
    if (this.isScrollbarVisible && !isVisible) {
      this.hideScrollbar();
    }
    if (!this.isScrollbarVisible && isVisible) {
      this.unhideScrollbar();
    }
  }
}
