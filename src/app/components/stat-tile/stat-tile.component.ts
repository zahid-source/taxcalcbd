import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-stat-tile',
  styleUrl: './stat-tile.component.css',
  template: `
    <div class="tile">
      <span class="tile-label">{{ label }}</span>
      <strong class="tile-value">{{ value }}@if (unit) {<span class="tile-unit">{{ unit }}</span>}</strong>
      @if (meter !== null) {
        <span class="meter" role="presentation">
          <span class="meter-fill" [style.width.%]="meterPct"></span>
        </span>
      }
      @if (hint) {
        <span class="tile-hint">{{ hint }}</span>
      }
    </div>
  `
})
export class StatTileComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() unit = '';
  @Input() hint = '';
  /** 0..1 - draws a meter under the value */
  @Input() meter: number | null = null;

  get meterPct(): number {
    return Math.max(0, Math.min(100, (this.meter || 0) * 100));
  }
}
