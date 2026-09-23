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
  installed = App.readInstalledFlag();
  showIosHelp = false;

  private static readonly INSTALLED_KEY = 'taxcalc-installed';

  private static readInstalledFlag(): boolean {
    try {
      return localStorage.getItem(App.INSTALLED_KEY) === '1';
    } catch {
      return false;
    }
  }

  async ngOnInit() {
    if (this.runningStandalone) {
      this.setInstalled(true);
      return;
    }
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
    if (!nav.getInstalledRelatedApps) return;
    try {
      // this also clears the flag once the app is uninstalled again
      this.setInstalled((await nav.getInstalledRelatedApps()).length > 0);
    } catch {
      // the check is a nicety - the install prompt still decides
    }
  }

  private setInstalled(installed: boolean) {
    this.installed = installed;
    if (installed) this.installPrompt = null;
    try {
      if (installed) {
        localStorage.setItem(App.INSTALLED_KEY, '1');
      } else {
        localStorage.removeItem(App.INSTALLED_KEY);
      }
    } catch {
      // private mode - the prompt check below still decides
    }
  }

  /**
   * Chromium raises beforeinstallprompt whenever the app can be installed and
   * stays silent once it is, so the event is the signal. Safari never raises
   * it at all, which is why iOS falls back to the how-to panel.
   */
  get showInstallButton(): boolean {
    if (this.runningStandalone || this.installed) return false;
    return this.installPrompt !== null || this.isIos;
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
    // the browser only raises this when the app is NOT installed, so any
    // remembered install is stale - an uninstall lands here
    event.preventDefault();
    this.setInstalled(false);
    this.installPrompt = event as InstallPromptEvent;
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.setInstalled(true);
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
    if (choice.outcome === 'accepted') this.setInstalled(true);
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

  get childAllowanceLabel(): string {
    return 'Tk ' + groupedNumber(this.taxModel.DISABLED_CHILD_ALLOWANCE);
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
