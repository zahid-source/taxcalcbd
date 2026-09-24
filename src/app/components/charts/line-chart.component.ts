import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import {compactMoney, groupedNumber, niceTicks} from './chart-utils';

export interface LinePoint {
  x: number;
  y: number;
}

export interface ChartExtra {
  /** name shown in the tooltip and the data-table header */
  label: string;
  /** pre-formatted, index-aligned with the first series' points */
  values: string[];
}

export interface LineSeries {
  name: string;
  /** css custom property carrying the series colour, e.g. 'var(--series-1)' */
  color: string;
  points: LinePoint[];
}

interface Tick {
  v: number;
  pos: number;
  label: string;
}

@Component({
  selector: 'app-line-chart',
  styleUrl: './chart.css',
  template: `
    <figure class="chart" #host>
      <figcaption class="chart-head">
        <div class="chart-heading">
          <div class="chart-title-row">
            <h4 class="chart-title">{{ title }}</h4>
            <ng-content select="[chart-control]"></ng-content>
            @if (zoom) {
              <button type="button" class="zoom-reset" (click)="resetZoom()">
                <i class="pi pi-refresh"></i> Reset zoom
              </button>
            }
          </div>
          @if (subtitle) {
            <p class="chart-sub">{{ subtitle }}</p>
          }
        </div>
        @if (series.length > 1) {
          <ul class="legend">
            @for (s of series; track s.name) {
              <li>
                <button type="button" class="legend-btn" [class.is-off]="isHidden(s.name)"
                        [attr.aria-pressed]="!isHidden(s.name)"
                        (click)="toggle(s.name)">
                  <span class="key key-line" [style.background]="s.color"></span>{{ s.name }}
                </button>
              </li>
            }
          </ul>
        }
      </figcaption>

      <div class="plot-wrap">
        <svg [attr.viewBox]="'0 0 ' + w + ' ' + viewH" [attr.height]="viewH" width="100%"
             role="img" [attr.aria-label]="ariaLabel || title"
             (pointerdown)="startSelect($event)"
             (pointermove)="onMove($event)"
             (pointerup)="endSelect($event)"
             (pointercancel)="cancelSelect()"
             (pointerleave)="hover = null">

        <defs>
          <clipPath [attr.id]="clipId">
            <rect [attr.x]="padL" [attr.y]="padT - 6"
                  [attr.width]="plotW" [attr.height]="plotH + 6"></rect>
          </clipPath>
        </defs>

          @for (t of yTicks; track t.v) {
            <line class="grid" [attr.x1]="padL" [attr.x2]="w - padR" [attr.y1]="t.pos" [attr.y2]="t.pos"></line>
            <text class="tick" [attr.x]="padL - 8" [attr.y]="t.pos + 4" text-anchor="end">{{ t.label }}</text>
          }

          <line class="axis" [attr.x1]="padL" [attr.x2]="w - padR"
                [attr.y1]="padT + plotH" [attr.y2]="padT + plotH"></line>

          @for (t of xTicks; track t.v) {
            <text class="tick" [attr.x]="t.pos" [attr.y]="padT + plotH + 18" text-anchor="middle">{{ t.label }}</text>
          }

          <g [attr.clip-path]="'url(#' + clipId + ')'">
            @for (p of paths; track p.name) {
              @if (area && shownCount === 1) {
                <path [attr.d]="p.area" [attr.fill]="p.color" fill-opacity="0.1"></path>
              }
              <path [attr.d]="p.line" fill="none" [attr.stroke]="p.color" stroke-width="2"
                    stroke-linejoin="round" stroke-linecap="round"></path>
            }
          </g>

          @if (selectBand) {
            <rect class="zoom-band" [attr.x]="selectBand.x" [attr.y]="padT"
                  [attr.width]="selectBand.w" [attr.height]="plotH"></rect>
          }

          @if (markerPos && !selectBand) {
            <line class="marker-guide" [attr.x1]="markerPos.x" [attr.x2]="markerPos.x"
                  [attr.y1]="markerPos.top" [attr.y2]="padT + plotH"></line>
            @for (dot of markerPos.dots; track $index) {
              <circle [attr.cx]="markerPos.x" [attr.cy]="dot.y" r="5"
                      [attr.fill]="dot.color" class="marker-dot"></circle>
            }
            <text class="marker-label" [attr.x]="markerPos.labelX" [attr.y]="markerPos.top - 12"
                  [attr.text-anchor]="markerPos.anchor">{{ markerLabel }}</text>
          }

          @if (hover !== null && !selectBand) {
            <line class="crosshair" [attr.x1]="hoverX" [attr.x2]="hoverX"
                  [attr.y1]="padT" [attr.y2]="padT + plotH"></line>
            @for (p of paths; track p.name) {
              <circle [attr.cx]="hoverX" [attr.cy]="p.dots[hover]" r="4.5"
                      [attr.fill]="p.color" class="marker-dot"></circle>
            }
          }
        </svg>

        @if (hover !== null && !selectBand) {
          <div class="tooltip" [style.left.%]="tipLeft" [style.transform]="tipShift">
            <div class="tip-x">
              <span class="tip-name">{{ xLabel }}</span>
              <span class="tip-val">{{ groupedNumber(visibleSeries[0].points[hover].x) }}</span>
            </div>
            @for (s of visibleSeries; track s.name) {
              <div class="tip-row">
                <span class="key" [style.background]="s.color"></span>
                <span class="tip-name">{{ s.name }}</span>
                <span class="tip-val">{{ fmtY(s.points[hover].y) }}</span>
              </div>
            }
            @for (e of extras; track e.label; let first = $first) {
              @if (e.values.length) {
                <div class="tip-row" [class.tip-extra]="first">
                  <span class="tip-name">{{ e.label }}</span>
                  <span class="tip-val">{{ e.values[hover] }}</span>
                </div>
              }
            }
          </div>
        }
      </div>

      <div class="resize-grip" title="Drag to resize, double click to reset"
           role="separator" aria-label="Chart height"
           (pointerdown)="startResize($event)"
           (pointermove)="onResize($event)"
           (pointerup)="endResize($event)"
           (pointercancel)="endResize($event)"
           (dblclick)="resetHeight()">
        <span class="grip-bar"></span>
      </div>

      <details class="data-table">
        <summary>Data table</summary>
        <table>
          <thead>
            <tr>
              <th>{{ xLabel || 'x' }}</th>
              @for (s of visibleSeries; track s.name) {
                <th>{{ s.name }}</th>
              }
              @for (e of extras; track e.label) {
                @if (e.values.length) {
                  <th>{{ e.label }}</th>
                }
              }
            </tr>
          </thead>
          <tbody>
            @for (i of viewIndexes; track i) {
              <tr>
                <td>{{ groupedNumber(visibleSeries[0].points[i].x) }}</td>
                @for (s of visibleSeries; track s.name) {
                  <td>{{ fmtY(s.points[i].y) }}</td>
                }
                @for (e of extras; track e.label) {
                  @if (e.values.length) {
                    <td>{{ e.values[i] }}</td>
                  }
                }
              </tr>
            }
          </tbody>
        </table>
      </details>
    </figure>
  `
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() series: LineSeries[] = [];
  @Input() title = '';
  @Input() subtitle = '';
  @Input() xLabel = '';
  /** spoken label when the visible title is split across a control */
  @Input() ariaLabel = '';
  /** measures shown in the tooltip and table only - never drawn */
  @Input() extras: ChartExtra[] = [];
  @Input() marker: LinePoint | null = null;
  @Input() markerLabel = 'You';
  @Input() area = true;
  @Input() h = 280;
  /** drawn height - the reader can drag the grip to change it */
  viewH = 280;
  /** how y values read: money uses digit grouping, percent adds a % suffix */
  @Input() yFormat: 'money' | 'percent' = 'money';
  /** name of the one series shown until the reader turns others on from the legend */
  @Input() soloSeries = '';

  @ViewChild('host') host!: ElementRef<HTMLElement>;

  w = 680;
  padL = 54;
  padR = 18;
  padT = 14;
  padB = 34;

  yTicks: Tick[] = [];
  xTicks: Tick[] = [];
  paths: { name: string; color: string; line: string; area: string; dots: number[] }[] = [];
  markerPos: { x: number; top: number; labelX: number; anchor: string;
    dots: { y: number; color: string }[] } | null = null;
  hover: number | null = null;
  /** series names the reader has switched off from the legend */
  private hiddenNames = new Set<string>();
  private appliedSolo: string | null = null;
  private resizeFrom: { y: number; h: number } | null = null;
  /** x range the reader dragged out, in data units */
  zoom: { x0: number; x1: number } | null = null;
  selectBand: { x: number; w: number } | null = null;
  private selectFrom: number | null = null;
  private static uid = 0;
  readonly clipId = 'plot-clip-' + (LineChartComponent.uid += 1);

  private x0 = 0;
  private x1 = 1;
  private y1 = 1;
  private ro?: ResizeObserver;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  groupedNumber = groupedNumber;

  get shownCount(): number {
    return this.visibleSeries.length;
  }

  /** y value as the tooltip and the data table show it */
  fmtY(value: number): string {
    return this.yFormat === 'percent' ? trimPercent(value) : groupedNumber(value);
  }

  /** y value as the axis shows it */
  tickY(value: number): string {
    return this.yFormat === 'percent' ? trimPercent(value) : compactMoney(value);
  }

  /** indexes of the points inside the current zoom window */
  get viewIndexes(): number[] {
    const points = this.visibleSeries[0]?.points ?? [];
    const out: number[] = [];
    points.forEach((p, i) => {
      if (!this.zoom || (p.x >= this.zoom.x0 && p.x <= this.zoom.x1)) out.push(i);
    });
    return out;
  }

  /** the series actually drawn - the legend can switch any of them off */
  get visibleSeries(): LineSeries[] {
    const shown = this.series.filter(s => !this.hiddenNames.has(s.name));
    return shown.length ? shown : this.series;
  }

  isHidden(name: string): boolean {
    return this.hiddenNames.has(name) && this.visibleSeries.length !== this.series.length;
  }

  /** the last visible line stays on - an empty chart tells the reader nothing */
  toggle(name: string): void {
    if (this.hiddenNames.has(name)) {
      this.hiddenNames.delete(name);
    } else if (this.series.filter(s => !this.hiddenNames.has(s.name)).length > 1) {
      this.hiddenNames.add(name);
    } else {
      return;
    }
    this.hover = null;
    this.layout();
  }

  get plotW(): number {
    return this.w - this.padL - this.padR;
  }

  get plotH(): number {
    return this.viewH - this.padT - this.padB;
  }

  get hoverX(): number {
    return this.hover === null ? 0 : this.xOf(this.visibleSeries[0].points[this.hover].x);
  }

  get tipLeft(): number {
    return (this.hoverX / this.w) * 100;
  }

  get tipShift(): string {
    const ratio = this.hoverX / this.w;
    const shift = ratio > 0.7 ? -100 : ratio < 0.3 ? 0 : -50;
    return 'translateX(' + shift + '%)';
  }

  ngAfterViewInit(): void {
    const el = this.host?.nativeElement;
    if (el) {
      this.w = el.clientWidth || this.w;
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(entries => {
          const width = Math.round(entries[0].contentRect.width);
          if (width > 120 && Math.abs(width - this.w) > 2) {
            this.zone.run(() => {
              this.w = width;
              this.layout();
              this.cdr.markForCheck();
            });
          }
        });
        this.ro.observe(el);
      }
    }
    this.layout();
    this.cdr.detectChanges();
  }

  ngOnChanges(): void {
    // a height the reader set by hand outlives a data change
    if (this.resizeFrom === null && !this.heightTouched) {
      this.viewH = this.h;
    }
    if (this.soloSeries && this.soloSeries !== this.appliedSolo) {
      this.appliedSolo = this.soloSeries;
      this.hiddenNames = new Set(
        this.series.map(s => s.name).filter(name => name !== this.soloSeries)
      );
    }
    this.hover = null;
    this.layout();
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  /* height grip ------------------------------------------------ */

  private heightTouched = false;

  startResize(event: PointerEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.resizeFrom = {y: event.clientY, h: this.viewH};
  }

  onResize(event: PointerEvent): void {
    if (!this.resizeFrom) return;
    const next = this.resizeFrom.h + (event.clientY - this.resizeFrom.y);
    this.viewH = Math.round(Math.max(160, Math.min(900, next)));
    this.heightTouched = true;
    this.layout();
  }

  endResize(event: PointerEvent): void {
    if (!this.resizeFrom) return;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    this.resizeFrom = null;
  }

  resetHeight(): void {
    this.heightTouched = false;
    this.viewH = this.h;
    this.layout();
  }

  onMove(event: PointerEvent): void {
    const points = this.visibleSeries[0]?.points;
    if (!points || points.length < 2) return;
    const px = this.pxOf(event);

    if (this.selectFrom !== null) {
      const from = Math.min(this.selectFrom, px);
      const to = Math.max(this.selectFrom, px);
      this.selectBand = {x: from, w: Math.max(0, to - from)};
      this.hover = null;
      return;
    }

    const value = this.valueAt(px);
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].x - value) < Math.abs(points[best].x - value)) best = i;
    }
    this.hover = best;
  }

  /* selection zoom --------------------------------------------- */

  startSelect(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const px = this.pxOf(event);
    if (px < this.padL || px > this.w - this.padR) return;
    event.preventDefault();
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    this.selectFrom = px;
    this.hover = null;
  }

  endSelect(event: PointerEvent): void {
    const target = event.currentTarget as SVGSVGElement;
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    const band = this.selectBand;
    this.selectFrom = null;
    this.selectBand = null;
    // a click, not a drag - leave the view alone
    if (!band || band.w < 12) return;

    const x0 = this.valueAt(band.x);
    const x1 = this.valueAt(band.x + band.w);
    if (x1 - x0 <= 0) return;
    this.zoom = {x0, x1};
    this.hover = null;
    this.layout();
  }

  cancelSelect(): void {
    this.selectFrom = null;
    this.selectBand = null;
  }

  resetZoom(): void {
    this.zoom = null;
    this.hover = null;
    this.layout();
  }

  /** pointer position in the svg's own coordinates */
  private pxOf(event: PointerEvent): number {
    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * this.w;
  }

  /** svg x -> data x */
  private valueAt(px: number): number {
    const t = (px - this.padL) / Math.max(1, this.plotW);
    return this.x0 + Math.max(0, Math.min(1, t)) * (this.x1 - this.x0);
  }

  layout(): void {
    const shown = this.visibleSeries;
    const all = shown.flatMap(s => s.points);
    if (!all.length) {
      this.paths = [];
      this.yTicks = [];
      this.xTicks = [];
      this.markerPos = null;
      return;
    }

    this.padL = this.w < 420 ? 42 : 54;
    this.x0 = this.zoom ? this.zoom.x0 : Math.min(...all.map(p => p.x));
    this.x1 = this.zoom ? this.zoom.x1 : Math.max(...all.map(p => p.x));

    // the y axis follows what the zoom window actually shows
    const inView = all.filter(p => p.x >= this.x0 && p.x <= this.x1);
    const yMax = Math.max(...(inView.length ? inView : all).map(p => p.y), 1);

    const yt = niceTicks(0, yMax, 4);
    this.y1 = yt[yt.length - 1];
    this.yTicks = yt.map(v => ({v, pos: this.yOf(v), label: this.tickY(v)}));

    const xt = niceTicks(this.x0, this.x1, this.w < 420 ? 3 : 5)
      .filter(v => v >= this.x0 - 1e-9 && v <= this.x1 + 1e-9);
    this.xTicks = xt.map(v => ({v, pos: this.xOf(v), label: compactMoney(v)}));

    this.paths = shown.map(s => {
      const dots = s.points.map(p => this.yOf(p.y));
      const line = s.points
        .map((p, i) => (i === 0 ? 'M' : 'L') + this.xOf(p.x) + ' ' + this.yOf(p.y))
        .join(' ');
      const base = this.padT + this.plotH;
      const first = s.points[0];
      const last = s.points[s.points.length - 1];
      const area = line
        + ' L' + this.xOf(last.x) + ' ' + base
        + ' L' + this.xOf(first.x) + ' ' + base + ' Z';
      return {name: s.name, color: s.color, line, area, dots};
    });

    if (this.marker) {
      const markerX = this.marker.x;
      const mx = this.xOf(markerX);
      const ratio = (mx - this.padL) / Math.max(1, this.plotW);

      // every series carries the exact point, so each line gets its own dot
      const dots = shown
        .map(s => {
          const hit = s.points.find(p => p.x === markerX);
          return hit ? {y: this.yOf(hit.y), color: s.color} : null;
        })
        .filter((d): d is { y: number; color: string } => d !== null);

      if (!dots.length) {
        dots.push({y: this.yOf(this.marker.y), color: shown[0].color});
      }

      this.markerPos = {
        x: mx,
        top: Math.min(...dots.map(d => d.y)),
        dots,
        labelX: ratio > 0.85 ? mx - 6 : ratio < 0.12 ? mx + 6 : mx,
        anchor: ratio > 0.85 ? 'end' : ratio < 0.12 ? 'start' : 'middle'
      };
    } else {
      this.markerPos = null;
    }
  }

  private xOf(v: number): number {
    const span = this.x1 - this.x0 || 1;
    return this.padL + ((v - this.x0) / span) * this.plotW;
  }

  private yOf(v: number): number {
    return this.padT + this.plotH - (v / (this.y1 || 1)) * this.plotH;
  }
}

/** one decimal, with the sign kept: 12.5% */
function trimPercent(value: number): string {
  if (!isFinite(value)) return '0.0%';
  return (Math.round(value * 10) / 10).toFixed(1) + '%';
}
