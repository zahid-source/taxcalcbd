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
        <div>
          <h4 class="chart-title">{{ title }}</h4>
          @if (subtitle) {
            <p class="chart-sub">{{ subtitle }}</p>
          }
        </div>
        @if (series.length > 1) {
          <ul class="legend">
            @for (s of series; track s.name) {
              <li><span class="key key-line" [style.background]="s.color"></span>{{ s.name }}</li>
            }
          </ul>
        }
      </figcaption>

      <div class="plot-wrap">
        <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" [attr.height]="h" width="100%"
             role="img" [attr.aria-label]="title"
             (pointermove)="onMove($event)" (pointerleave)="hover = null">

          @for (t of yTicks; track t.v) {
            <line class="grid" [attr.x1]="padL" [attr.x2]="w - padR" [attr.y1]="t.pos" [attr.y2]="t.pos"></line>
            <text class="tick" [attr.x]="padL - 8" [attr.y]="t.pos + 4" text-anchor="end">{{ t.label }}</text>
          }

          <line class="axis" [attr.x1]="padL" [attr.x2]="w - padR"
                [attr.y1]="padT + plotH" [attr.y2]="padT + plotH"></line>

          @for (t of xTicks; track t.v) {
            <text class="tick" [attr.x]="t.pos" [attr.y]="padT + plotH + 18" text-anchor="middle">{{ t.label }}</text>
          }

          @for (p of paths; track p.name) {
            @if (area && series.length === 1) {
              <path [attr.d]="p.area" [attr.fill]="p.color" fill-opacity="0.1"></path>
            }
            <path [attr.d]="p.line" fill="none" [attr.stroke]="p.color" stroke-width="2"
                  stroke-linejoin="round" stroke-linecap="round"></path>
          }

          @if (markerPos) {
            <line class="marker-guide" [attr.x1]="markerPos.x" [attr.x2]="markerPos.x"
                  [attr.y1]="markerPos.y" [attr.y2]="padT + plotH"></line>
            <circle [attr.cx]="markerPos.x" [attr.cy]="markerPos.y" r="5"
                    [attr.fill]="series[0].color" class="marker-dot"></circle>
            <text class="marker-label" [attr.x]="markerPos.labelX" [attr.y]="markerPos.y - 12"
                  [attr.text-anchor]="markerPos.anchor">{{ markerLabel }}</text>
          }

          @if (hover !== null) {
            <line class="crosshair" [attr.x1]="hoverX" [attr.x2]="hoverX"
                  [attr.y1]="padT" [attr.y2]="padT + plotH"></line>
            @for (p of paths; track p.name) {
              <circle [attr.cx]="hoverX" [attr.cy]="p.dots[hover]" r="4.5"
                      [attr.fill]="p.color" class="marker-dot"></circle>
            }
          }
        </svg>

        @if (hover !== null) {
          <div class="tooltip" [style.left.%]="tipLeft" [style.transform]="tipShift">
            <div class="tip-x">{{ xLabel }} {{ groupedNumber(series[0].points[hover].x) }}</div>
            @for (s of series; track s.name) {
              <div class="tip-row">
                <span class="key" [style.background]="s.color"></span>
                <span class="tip-name">{{ s.name }}</span>
                <span class="tip-val">{{ groupedNumber(s.points[hover].y) }}</span>
              </div>
            }
          </div>
        }
      </div>

      <details class="data-table">
        <summary>Data table</summary>
        <table>
          <thead>
            <tr>
              <th>{{ xLabel || 'x' }}</th>
              @for (s of series; track s.name) {
                <th>{{ s.name }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (p of series[0].points; track $index; let i = $index) {
              <tr>
                <td>{{ groupedNumber(p.x) }}</td>
                @for (s of series; track s.name) {
                  <td>{{ groupedNumber(s.points[i].y) }}</td>
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
  @Input() marker: LinePoint | null = null;
  @Input() markerLabel = 'You';
  @Input() area = true;
  @Input() h = 250;

  @ViewChild('host') host!: ElementRef<HTMLElement>;

  w = 680;
  padL = 54;
  padR = 18;
  padT = 14;
  padB = 34;

  yTicks: Tick[] = [];
  xTicks: Tick[] = [];
  paths: { name: string; color: string; line: string; area: string; dots: number[] }[] = [];
  markerPos: { x: number; y: number; labelX: number; anchor: string } | null = null;
  hover: number | null = null;

  private x0 = 0;
  private x1 = 1;
  private y1 = 1;
  private ro?: ResizeObserver;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  groupedNumber = groupedNumber;

  get plotW(): number {
    return this.w - this.padL - this.padR;
  }

  get plotH(): number {
    return this.h - this.padT - this.padB;
  }

  get hoverX(): number {
    return this.hover === null ? 0 : this.xOf(this.series[0].points[this.hover].x);
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
    this.hover = null;
    this.layout();
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  onMove(event: PointerEvent): void {
    const points = this.series[0]?.points;
    if (!points || points.length < 2) return;
    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * this.w;
    const t = (px - this.padL) / Math.max(1, this.plotW);
    const i = Math.round(t * (points.length - 1));
    this.hover = Math.max(0, Math.min(points.length - 1, i));
  }

  private layout(): void {
    const all = this.series.flatMap(s => s.points);
    if (!all.length) {
      this.paths = [];
      this.yTicks = [];
      this.xTicks = [];
      this.markerPos = null;
      return;
    }

    this.padL = this.w < 420 ? 42 : 54;
    this.x0 = Math.min(...all.map(p => p.x));
    this.x1 = Math.max(...all.map(p => p.x));
    const yMax = Math.max(...all.map(p => p.y), 1);

    const yt = niceTicks(0, yMax, 4);
    this.y1 = yt[yt.length - 1];
    this.yTicks = yt.map(v => ({v, pos: this.yOf(v), label: compactMoney(v)}));

    const xt = niceTicks(this.x0, this.x1, this.w < 420 ? 3 : 5)
      .filter(v => v >= this.x0 - 1e-9 && v <= this.x1 + 1e-9);
    this.xTicks = xt.map(v => ({v, pos: this.xOf(v), label: compactMoney(v)}));

    this.paths = this.series.map(s => {
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
      const mx = this.xOf(this.marker.x);
      const ratio = (mx - this.padL) / Math.max(1, this.plotW);
      this.markerPos = {
        x: mx,
        y: this.yOf(this.marker.y),
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
