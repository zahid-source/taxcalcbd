import {Component, HostListener, OnInit, inject} from '@angular/core';
import {SelectItem} from 'primeng/api';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalculation} from './components/tax-calculation/tax-calculation.component';
import {AY, AY_OPTIONS, AY_VALUE, incomeYearOf} from './models/model';
import {taxModelOf} from './models/tax-model-registry';
import {groupedNumber} from './components/charts/chart-utils';
import {ThemeService} from './services/theme-service';
import {SelectComponent} from './components/ui/select.component';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
export class App implements OnInit {
  AY: typeof AY = AY;
  selectedAy: AY_VALUE = AY.AY_2027_2028;
  ayOptions = AY_OPTIONS;

  /** the slab / tax-free-limit reference panel */
  showRates = false;

  /** install-as-app state */
  private installPrompt: InstallPromptEvent | null = null;
  /** the page itself is the installed app - nothing to offer */
  readonly runningStandalone = typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true);
  /** installed, but this tab is the browser one */
  installed = false;
  showIosHelp = false;

  async ngOnInit() {
    if (this.runningStandalone) return;
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
    if (!nav.getInstalledRelatedApps) return;
    try {
      this.installed = (await nav.getInstalledRelatedApps()).length > 0;
    } catch {
      // the check is a nicety - the install prompt still decides
    }
  }

  get showInstallButton(): boolean {
    return !this.runningStandalone && !this.installed;
  }

  get isIos(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac, so the touch points settle it
    const iOsDevice = /iPad|iPhone|iPod/.test(ua)
      || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    return iOsDevice && !/CriOS|FxiOS|EdgiOS/.test(ua);
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    // keep the event so the button can raise the prompt later
    event.preventDefault();
    this.installPrompt = event as InstallPromptEvent;
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.installPrompt = null;
    this.installed = true;
  }


  async install() {
    if (!this.installPrompt) {
      // Safari and Firefox never raise a prompt - the browser menu does it
      this.showIosHelp = true;
      return;
    }
    const prompt = this.installPrompt;
    this.installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') this.installed = true;
  }


  readonly themeService = inject(ThemeService);

  get incomeYear(): string {
    return incomeYearOf(this.selectedAy);
  }

  get taxModel() {
    return taxModelOf(this.selectedAy);
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
  closeOverlays() {
    this.showRates = false;
    this.showIosHelp = false;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  onAyChange(value: AY_VALUE) {
    // the child component reloads its model through ngOnChanges
    this.selectedAy = value;
  }

  print() {
    window.print();
  }
}
