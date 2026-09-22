/** Shared helpers for the hand-rolled SVG charts (no chart library needed). */

/** Indian/Bangladeshi digit grouping: 12,34,567 */
export function groupedNumber(amount: number): string {
  const negative = amount < 0;
  const amt = Math.round(Math.abs(amount)).toString();
  let out: string;
  if (amt.length <= 3) {
    out = amt;
  } else {
    const last3 = amt.slice(-3);
    let rest = amt.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    out = rest + ',' + last3;
  }
  return negative ? '-' + out : out;
}

/** Axis-sized money: 1.2Cr / 8.5L / 42k / 900 */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return trim(value / 1e7) + 'Cr';
  if (abs >= 1e5) return trim(value / 1e5) + 'L';
  if (abs >= 1000) return trim(value / 1000) + 'k';
  return String(Math.round(value));
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** Ticks rounded to 1/2/5 x 10^n so the axis reads in clean numbers. */
export function niceTicks(min: number, max: number, count: number = 5): number[] {
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (max <= min) return [min, min + 1];
  const raw = (max - min) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step * 1e-9; v += step) {
    out.push(Math.round(v * 1e6) / 1e6);
  }
  return out;
}
