import {Component, ElementRef, EventEmitter, HostListener, Input, Output, inject} from '@angular/core';

export interface SelectOption {
  /** optional so PrimeNG's SelectItem lists can be passed straight through */
  label?: string;
  value: any;
}

/**
 * Dropdown with a styled option list - native selects cannot have their popup
 * themed, so the list is rendered here and driven by keyboard + pointer.
 */
@Component({
  selector: 'app-select',
  template: `
    <div class="field" [class.field--inline]="inline" [class.field--open]="open">
      @if (label) {
        <span class="field-label">{{ label }}</span>
      }

      <button type="button" class="field-trigger"
              role="combobox" aria-haspopup="listbox"
              [attr.aria-expanded]="open"
              [attr.aria-label]="ariaLabel || label || null"
              (click)="toggle()"
              (keydown)="onKeydown($event)">
        <span class="field-value">{{ selectedLabel }}</span>
        <svg class="field-chevron" width="11" height="7" viewBox="0 0 11 7" aria-hidden="true">
          <path d="M1 1l4.5 4.5L10 1" fill="none" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>

      @if (open) {
        <ul class="listbox" role="listbox" [attr.aria-label]="label || ariaLabel || null">
          @for (option of options; track option.value; let i = $index) {
            <li class="option"
                role="option"
                [attr.aria-selected]="option.value === value"
                [class.option--active]="i === activeIndex"
                [class.option--selected]="option.value === value"
                (mousedown)="$event.preventDefault()"
                (mouseenter)="activeIndex = i"
                (click)="choose(option)">
              <span class="option-label">{{ labelOf(option) }}</span>
              @if (option.value === value) {
                <svg class="option-check" width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
                  <path d="M1 5l3.5 3.5L11 1.5" fill="none" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              }
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class SelectComponent {

  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() options: SelectOption[] = [];
  @Input() value: any = null;
  /** compact styling for controls that sit inside a heading */
  @Input() inline = false;

  @Output() valueChange = new EventEmitter<any>();

  open = false;
  activeIndex = -1;

  private readonly host = inject(ElementRef<HTMLElement>);

  get selectedLabel(): string {
    const match = this.options.find(o => o.value === this.value);
    return match ? this.labelOf(match) : '';
  }

  labelOf(option: SelectOption): string {
    return option.label ?? String(option.value);
  }

  toggle(): void {
    this.open ? this.close() : this.openList();
  }

  choose(option: SelectOption): void {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.close();
    this.focusTrigger();
  }

  onKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (!this.open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.openList();
      }
      return;
    }

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex = this.options.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeIndex >= 0 && this.activeIndex < this.options.length) {
          this.choose(this.options[this.activeIndex]);
        }
        break;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private openList(): void {
    this.open = true;
    const selected = this.options.findIndex(o => o.value === this.value);
    this.activeIndex = selected >= 0 ? selected : 0;
  }

  private close(): void {
    this.open = false;
    this.activeIndex = -1;
  }

  private move(step: number): void {
    const count = this.options.length;
    if (!count) return;
    this.activeIndex = (this.activeIndex + step + count) % count;
  }

  private focusTrigger(): void {
    const trigger = this.host.nativeElement.querySelector('.field-trigger') as HTMLElement | null;
    trigger?.focus();
  }
}
