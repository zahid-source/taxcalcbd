import {Component, Input} from '@angular/core';
import {InputNumber} from 'primeng/inputnumber';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalcService} from '../../services/tax-calc-service';

import {AY_VALUE, SlabRow, TaxAnalytics, TaxInput, TaxModel, TaxResult} from '../../models/model';
import {TAX_MODEL_25_26} from '../../models/ay25-26.model';
import {taxModelOf} from '../../models/tax-model-registry';
import {ChartExtra, LineChartComponent, LinePoint, LineSeries} from '../charts/line-chart.component';
import {StatTileComponent} from '../stat-tile/stat-tile.component';
import {SelectComponent} from '../ui/select.component';
import {groupedNumber} from '../charts/chart-utils';

type ResultTab = 'calculation' | 'analytics';

@Component({
  selector: 'app-ay25-26',
  imports: [
    InputNumber,
    ReactiveFormsModule,
    FormsModule,
    LineChartComponent,
    StatTileComponent,
    SelectComponent
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
  /** salary after TDS and the TDS rate at each curve point - tooltip only */
  salaryExtras: ChartExtra[] = [];
  incomeSeries: LineSeries[] = [];
  incomeMarker: LinePoint | null = null;
  /** effective rate at each curve point - tooltip only, never drawn */
  incomeExtras: ChartExtra[] = [];


  ngOnChanges() {
    if (!this.ay) {
      throw new Error('AY not provided!');
    }
    this.initializeFromModel();
    this.calculate();
  }

  private initializeFromModel() {
    // Load the correct model based on AY
    this.taxModel = taxModelOf(this.ay);
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
      const points = this.withCurrentPoint(curve.map(p => ({x: p.x, y: p.y})),
        this.monthlySalary, this.taxResult.monthlyTDS);
      this.salarySeries = [{
        name: 'Monthly TDS',
        color: 'var(--series-2)',
        points
      }];
      this.salaryExtras = [
        {
          label: 'Salary after TDS',
          values: points.map(p => groupedNumber(Math.max(0, p.x - p.y)))
        },
        {
          label: 'TDS rate',
          values: points.map(p => this.percent(p.x > 0 ? (p.y / p.x) * 100 : 0) + '%')
        }
      ];
      this.salaryMarker = {x: this.monthlySalary, y: this.taxResult.monthlyTDS};
    } else {
      this.salarySeries = [];
      this.salaryExtras = [];
      this.salaryMarker = null;
    }

    // one row set keeps both lines and the rate column index-aligned
    const rows = TaxCalcService.buildIncomeCurve(input, 500)
      .map(p => ({x: p.x, afterRebate: p.y, totalTax: p.totalTax, rate: p.rate}));

    rows.push({
      x: input.totalIncome,
      afterRebate: this.taxResult.taxAfterRebate,
      totalTax: this.taxResult.totalTax,
      rate: this.analytics.effectiveRate
    });
    rows.sort((a, b) => a.x - b.x);

    this.incomeSeries = [
      {
        name: 'Total tax',
        color: 'var(--series-2)',
        points: rows.map(r => ({x: r.x, y: r.totalTax}))
      },
      {
        name: 'Tax after rebate',
        color: 'var(--series-1)',
        points: rows.map(r => ({x: r.x, y: r.afterRebate}))
      }
    ];
    this.incomeExtras = [{
      label: 'Effective tax rate',
      values: rows.map(r => this.percent(r.rate) + '%')
    }];
    this.incomeMarker = {x: input.totalIncome, y: this.taxResult.taxAfterRebate};
  }

  /** Makes sure the drawn curve passes exactly through the user's own figures. */
  private withCurrentPoint(curve: LinePoint[], x: number, y: number): LinePoint[] {
    const points: LinePoint[] = [...curve, {x, y}];
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
