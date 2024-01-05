import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  HostBinding,
  HostListener,
  Input,
} from '@angular/core';

@Directive({
  selector: 'textarea[resizeOnInput]',
  standalone: true,
})
export class ResizeTextareaOnInputDirective {
  @HostBinding('style.height')
  get height(): string {
    return `${this._heightPx}px`;
  }
  _heightPx: number = 60;

  @HostListener('input', ['$event.target'])
  onInput(textarea: HTMLTextAreaElement) {
    this._heightPx = textarea.scrollHeight;
  }
}
