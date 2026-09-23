import {Component, HostListener, inject} from '@angular/core';
import {SelectItem} from 'primeng/api';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalculation} from './components/tax-calculation/tax-calculation.component';
import {AY, AY_OPTIONS, AY_VALUE, incomeYearOf} from './models/model';
import {taxModelOf} from './models/tax-model-registry';
import {groupedNumber} from './components/charts/chart-utils';
import {ThemeService} from './services/theme-service';
import {SelectComponent} from './components/ui/select.component';

interface RateOption {
  amount: string;
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, FormsModule, TaxCalculation, SelectComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  AY: typeof AY = AY;
  selectedAy: string = AY.AY_2027_2028;
  ayOptions = AY_OPTIONS;

  /** the slab / tax-free-limit reference panel */
  showRates = false;

  readonly themeService = inject(ThemeService);

  get incomeYear(): string {
    return incomeYearOf(this.selectedAy);
  }

  get taxModel() {
    return taxModelOf(this.selectedAy as AY_VALUE);
  }

  /** the rate card for the selected AY - zero band first, then every slab */
  get rateRows(): { label: string; range: string; rate: number; color: string }[] {
    const model = this.taxModel;
    const rows: { label: string; range: string; rate: number; color: string }[] = [];
    let from = Number(model.TAX_FREE_LIMIT_OPTIONS[0].value);
    let taxedSlab = 0;

    rows.push({
      label: 'First ' + groupedNumber(from),
      range: '0 - ' + groupedNumber(from),
      rate: 0,
      color: 'var(--slab-free)'
    });

    for (const slab of model.SLAB) {
      const color = 'var(--slab-' + Math.min(++taxedSlab, 6) + ')';
      if (!isFinite(slab.limit)) {
        rows.push({
          label: 'Remaining amount',
          range: 'Above ' + groupedNumber(from),
          rate: slab.rate,
          color
        });
        break;
      }
      const to = from + slab.limit;
      rows.push({
        label: 'Next ' + groupedNumber(slab.limit),
        range: groupedNumber(from) + ' - ' + groupedNumber(to),
        rate: slab.rate,
        color
      });
      from = to;
    }
    return rows;
  }

  /** the highest slab rate, used to size the rate pills */
  get topRate(): number {
    return Math.max(...this.rateRows.map(r => r.rate), 1);
  }

  get limitOptions(): RateOption[] {
    return this.splitOptions(this.taxModel.TAX_FREE_LIMIT_OPTIONS);
  }

  get minTaxOptions(): RateOption[] {
    return this.splitOptions(this.taxModel.MIN_TAX_OPTIONS);
  }

  /** 'x,xx,xxx (Who it applies to)' splits into its own amount and name columns */
  private splitOptions(options: SelectItem[]): RateOption[] {
    return options.map(option => {
      const label = String(option.label ?? '');
      const match = /^([^(]+?)\s*\((.+)\)$/.exec(label);
      return {
        amount: match ? match[1] : label,
        name: match ? match[2] : ''
      };
    });
  }

  get exemptionSummary(): string {
    const model = this.taxModel;
    return Math.round(model.EXEMPTION_RATE * 100) + '% of total income, up to Tk '
      + groupedNumber(model.MAX_EXEMPTION);
  }

  get rebateSummary(): string {
    const model = this.taxModel;
    return Math.round(model.REBATE_RATE_ON_TAXABLE_INCOME * 100) + '% of taxable income or '
      + Math.round(model.REBATE_RATE_ON_ACTUAL_INVESTMENT * 100) + '% of investment, up to Tk '
      + groupedNumber(model.MAX_REBATE);
  }

  get isDark(): boolean {
    return this.themeService.theme() === 'dark';
  }

  @HostListener('document:keydown.escape')
  closeRates() {
    this.showRates = false;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  onAyChange(value: string) {
    // the child component reloads its model through ngOnChanges
    this.selectedAy = value;
  }

  print() {
    window.print();
  }
}
