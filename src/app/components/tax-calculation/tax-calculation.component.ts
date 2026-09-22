import {Component, Input} from '@angular/core';
import {InputNumber} from 'primeng/inputnumber';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalcService} from '../../services/tax-calc-service';

import {AY, AY_VALUE, CurvePoint, SlabRow, TaxAnalytics, TaxInput, TaxModel, TaxResult} from '../../models/model';
import {TAX_MODEL_25_26} from '../../models/ay25-26.model';
import {TAX_MODEL_26_27} from '../../models/ay26-27.model';
import {LineChartComponent, LinePoint, LineSeries} from '../charts/line-chart.component';
import {StatTileComponent} from '../stat-tile/stat-tile.component';
import {groupedNumber} from '../charts/chart-utils';

type ResultTab = 'calculation' | 'analytics';
type IncomeMeasure = 'AFTER_REBATE' | 'TOTAL_TAX';

@Component({
  selector: 'app-ay25-26',
  imports: [
    InputNumber,
    ReactiveFormsModule,
    FormsModule,
    LineChartComponent,
    StatTileComponent
  ],
  templateUrl: './tax-calculation.component.html',
  styleUrl: './tax-calculation.component.css'
})
export class TaxCalculation {

  @Input() ay!: AY_VALUE;

  taxModel: TaxModel = TAX_MODEL_25_26;

  //user-input
  monthlySalary: number = 0;
  festivalBonus: number = 0;
  totalIncome: number = 0;

  taxResult!: TaxResult;
  analytics!: TaxAnalytics;
  isShow: boolean = false;

  activeTab: ResultTab = 'calculation';

  /** slab lines with their share of taxable income, for the calculation view */
  slabRows: SlabRow[] = [];

  // chart data
  showMonthlyCharts = false;
  salarySeries: LineSeries[] = [];
  salaryMarker: LinePoint | null = null;
  incomeSeries: LineSeries[] = [];
  incomeMarker: LinePoint | null = null;

  /** what the "total income vs ..." chart plots */
  incomeMeasure: IncomeMeasure = 'AFTER_REBATE';
  readonly INCOME_MEASURE_OPTIONS = [
    {label: 'Tax after max rebate', value: 'AFTER_REBATE'},
    {label: 'Total tax', value: 'TOTAL_TAX'}
  ];
  private incomeCurve: CurvePoint[] = [];

  ngOnChanges() {
    if (!this.ay) {
      throw new Error('AY not provided!');
    }
    this.initializeFromModel();
    this.calculate();
  }

  private initializeFromModel() {

    // Load the correct model based on AY
    switch (this.ay) {
      case AY.AY_2025_2026:
        this.taxModel = TAX_MODEL_25_26;
        break;
      case AY.AY_2026_2027:
        this.taxModel = TAX_MODEL_26_27;
        break;
      default:
        throw new Error('Unsupported AY');
    }

  }

  /* ---------------------------------------------------------------
   * Live input handlers - every change recalculates immediately
   * --------------------------------------------------------------- */

  onMonthlySalaryChange(value: number | null) {
    this.monthlySalary = value ?? 0;
    this.calcFestival();
    this.calculate();
  }

  onFestivalBonusChange(value: number | null) {
    this.festivalBonus = value ?? 0;
    this.calculate();
  }

  onTotalIncomeChange(value: number | null) {
    this.totalIncome = value ?? 0;
    this.calculate();
  }

  onCalcInputChange(value: string) {
    // values carry over where two modes share a field
    this.taxModel.calcInput = value;
    this.calculate();
  }

  onTaxFreeLimitChange(value: number) {
    this.taxModel.taxFreeLimit = value;
    this.calculate();
  }

  onMinTaxChange(value: number) {
    this.taxModel.minTax = value;
    this.calculate();
  }

  calculate() {

    this.handleCalcInput();

    if (!this.totalIncome || this.totalIncome <= 0) {
      this.isShow = false;
      return;
    }

    const input: TaxInput = {
      totalIncome: Number(this.totalIncome) || 0,
      taxFreeLimit: Number(this.taxModel.taxFreeLimit),
      minTax: Number(this.taxModel.minTax),
      slabs: this.taxModel.SLAB,
      exemptionRate: this.taxModel.EXEMPTION_RATE,
      maxExemption: this.taxModel.MAX_EXEMPTION,
      rebateRateOnTaxableIncome: this.taxModel.REBATE_RATE_ON_TAXABLE_INCOME,
      rebateRateOnActualInvestment: this.taxModel.REBATE_RATE_ON_ACTUAL_INVESTMENT,
      maxRebate: this.taxModel.MAX_REBATE
    };

    this.taxResult = TaxCalcService.calculateTax(input);
    this.analytics = TaxCalcService.buildAnalytics(input, this.taxResult, this.monthlySalary);
    this.slabRows = this.buildSlabRows();
    this.buildCharts(input);
    this.isShow = true;
  }


  private handleCalcInput() {
    this.taxModel.EXEMPTION_RATE = this.taxModel.exemptionBackup;
    if (this.taxModel.calcInput == this.taxModel.CALC_INPUT_ENUM.MONTHLY_SALARY)
      this.totalIncome = this.monthlySalary * 12 + this.festivalBonus;
    else if (this.taxModel.calcInput == this.taxModel.CALC_INPUT_ENUM.ONLY_SLAB) {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
      this.taxModel.EXEMPTION_RATE = 0;
    } else {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
    }
  }

  /* ---------------------------------------------------------------
   * Calculation view
   * --------------------------------------------------------------- */

  private buildSlabRows(): SlabRow[] {
    const taxable = this.taxResult.totalIncomeAfterExemption || 1;
    let from = 0;
    let taxedSlab = 0;

    return this.taxResult.slabBreakDown.map((slab, i) => {
      const to = from + slab.amount;
      const row: SlabRow = {
        label: (i === 0 ? 'First ' : 'Next ') + groupedNumber(slab.amount),
        range: groupedNumber(from) + ' - ' + groupedNumber(to),
        amount: slab.amount,
        rate: slab.rate,
        tax: slab.tax,
        share: (slab.amount / taxable) * 100,
        color: slab.rate === 0
          ? 'var(--slab-free)'
          : 'var(--slab-' + Math.min(++taxedSlab, 6) + ')'
      };
      from = to;
      return row;
    });
  }

  get exemptionApplied(): boolean {
    return this.taxModel.calcInput != this.taxModel.CALC_INPUT_ENUM.ONLY_SLAB;
  }

  /* ---------------------------------------------------------------
   * Charts
   * --------------------------------------------------------------- */

  private buildCharts(input: TaxInput) {
    const isMonthlyMode = this.taxModel.calcInput == this.taxModel.CALC_INPUT_ENUM.MONTHLY_SALARY;
    this.showMonthlyCharts = isMonthlyMode && this.monthlySalary > 0;

    if (this.showMonthlyCharts) {
      const bonusRatio = this.monthlySalary > 0 ? this.festivalBonus / this.monthlySalary : 0;
      const curve = TaxCalcService.buildSalaryCurve(input, this.monthlySalary, bonusRatio, 500);
      this.salarySeries = [{
        name: 'Monthly tax',
        color: 'var(--series-2)',
        points: this.withCurrentPoint(curve, this.monthlySalary, this.taxResult.monthlyTDS)
      }];
      this.salaryMarker = {x: this.monthlySalary, y: this.taxResult.monthlyTDS};
    } else {
      this.salarySeries = [];
      this.salaryMarker = null;
    }

    this.incomeCurve = TaxCalcService.buildIncomeCurve(input, 500);
    this.applyIncomeMeasure();
  }

  /** rebuilds the income chart for whichever measure the dropdown holds */
  private applyIncomeMeasure() {
    if (!this.incomeCurve.length || !this.taxResult) return;

    const useTotalTax = this.incomeMeasure === 'TOTAL_TAX';
    const current = useTotalTax ? this.taxResult.totalTax : this.taxResult.taxAfterRebate;
    const points: LinePoint[] = this.incomeCurve.map(p => ({x: p.x, y: useTotalTax ? p.totalTax : p.y}));
    points.push({x: this.totalIncome, y: current});
    points.sort((a, b) => a.x - b.x);

    this.incomeSeries = [{name: this.incomeMeasureLabel, color: 'var(--series-1)', points}];
    this.incomeMarker = {x: this.totalIncome, y: current};
  }

  onIncomeMeasureChange(value: IncomeMeasure) {
    this.incomeMeasure = value;
    this.applyIncomeMeasure();
  }

  get incomeMeasureLabel(): string {
    return this.incomeMeasure === 'TOTAL_TAX' ? 'Total tax' : 'Tax after max rebate';
  }

  get incomeMeasureSubtitle(): string {
    return this.incomeMeasure === 'TOTAL_TAX'
      ? 'Slab tax before any rebate, across income levels'
      : 'Tax payable once the rebate is applied, across income levels';
  }

  /** Makes sure the drawn curve passes exactly through the user's own figures. */
  private withCurrentPoint(curve: CurvePoint[], x: number, y: number): LinePoint[] {
    const points: LinePoint[] = curve.map(p => ({x: p.x, y: p.y}));
    points.push({x, y});
    points.sort((a, b) => a.x - b.x);
    return points;
  }

  /* ---------------------------------------------------------------
   * Formatting helpers
   * --------------------------------------------------------------- */

  formatIndianNumber(amount: number): string {
    return groupedNumber(amount);
  }

  percent(value: number): string {
    if (!isFinite(value)) return '0.0';
    return (Math.round(value * 10) / 10).toFixed(1);
  }

  calcFestival() {
    this.festivalBonus = this.monthlySalary * 1.2;
  }
}
