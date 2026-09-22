import {Injectable} from '@angular/core';
import {
  CurvePoint,
  RebateInput,
  RebateOutput,
  Slab,
  SlabBreakdown,
  SlabOutput,
  TaxAnalytics,
  TaxInput,
  TaxResult
} from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class TaxCalcService {

  static calculateExemption(totalIncome: number, exemptionRate: number, maxExemption: number): number {
    return Math.min(
      totalIncome * exemptionRate,
      maxExemption
    );
  }

  static calculateSlabs(incomeAfterExemption: number, taxFreeLimit: number, slabs: Slab[]): SlabOutput {
    let remainingIncome = incomeAfterExemption;
    let breakdown: SlabBreakdown[] = [];
    let totalTax = 0;
    let taxFreeAmount = Math.min(remainingIncome, taxFreeLimit);
    breakdown.push({amount: taxFreeAmount, rate: 0, tax: 0});
    remainingIncome -= taxFreeAmount;
    for (let i = 0; i < slabs.length && remainingIncome > 0; i++) {
      const slab = slabs[i];
      const taxableAmount = Math.min(remainingIncome, slab.limit);
      const slabTax = Math.round(taxableAmount * (slab.rate / 100));
      breakdown.push({amount: taxableAmount, rate: slab.rate, tax: slabTax});
      totalTax += slabTax;
      remainingIncome -= taxableAmount;
    }

    totalTax = Math.round(totalTax);
    return {breakdown, totalTax};
  }


  static applyRebate(input: RebateInput): RebateOutput {
    let maxRebate = input.totalIncomeAfterExemption * input.rebateRateOnTaxableIncome;
    maxRebate = Math.min(maxRebate, input.maxRebate);
    maxRebate = Math.round(maxRebate);
    let taxAfterRebate = input.slabTax - maxRebate;
    if (input.slabTax == 0) {
      taxAfterRebate = 0;
      maxRebate = 0;
    } else if (taxAfterRebate <= input.minTax) {
      taxAfterRebate = input.minTax;
      maxRebate = (input.slabTax - taxAfterRebate);
      maxRebate = Math.max(maxRebate, 0);
    }
    taxAfterRebate = Math.round(taxAfterRebate);

    return {
      taxAfterRebate: taxAfterRebate,
      maxRebate: maxRebate,
      investRequired: maxRebate / input.rebateRateOnActualInvestment
    };
  }


  static calculateTax(input: TaxInput): TaxResult {

    const exemption = this.calculateExemption(input.totalIncome, input.exemptionRate, input.maxExemption);

    let totalIncomeAfterExemption = input.totalIncome - exemption;

    const slabResult: SlabOutput = this.calculateSlabs(
      totalIncomeAfterExemption,
      input.taxFreeLimit,
      input.slabs
    );

    const rebate: RebateOutput = this.applyRebate({
      totalIncomeAfterExemption: totalIncomeAfterExemption,
      slabTax: slabResult.totalTax,
      rebateRateOnTaxableIncome: input.rebateRateOnTaxableIncome,
      rebateRateOnActualInvestment: input.rebateRateOnActualInvestment,
      maxRebate: input.maxRebate,
      minTax: input.minTax
    });

    return {
      exemption,
      totalIncomeAfterExemption,
      maxRebate: rebate.maxRebate,
      totalTax: Math.max(slabResult.totalTax, rebate.taxAfterRebate),
      taxAfterRebate: rebate.taxAfterRebate,
      investRequired: rebate.investRequired,
      monthlyTDS: Math.round(rebate.taxAfterRebate / 12),
      slabBreakDown: slabResult.breakdown
    };
  }

  /* -------------------------------------------------------------
   * Analytics
   * ----------------------------------------------------------- */

  /* -------------------------------------------------------------
   * Analytics
   * ----------------------------------------------------------- */

  static buildAnalytics(input: TaxInput, result: TaxResult, monthlySalary: number): TaxAnalytics {
    const income = input.totalIncome;
    const payable = result.taxAfterRebate;
    const effectiveRate = income > 0 ? (payable / income) * 100 : 0;
    const marginalRate = result.slabBreakDown
      .filter(s => s.amount > 0)
      .reduce((max, s) => Math.max(max, s.rate), 0);

    return {
      effectiveRate,
      effectiveRateOnTaxable: result.totalIncomeAfterExemption > 0
        ? (payable / result.totalIncomeAfterExemption) * 100
        : 0,
      marginalRate,
      takeHomeRate: income > 0 ? 100 - effectiveRate : 0,
      rebateApplied: Math.max(result.totalTax - payable, 0),
      investRequired: result.investRequired,
      monthlyTDS: result.monthlyTDS,
      netMonthly: Math.max(monthlySalary - result.monthlyTDS, 0),
      netAnnual: income - payable,
      minTaxApplied: result.totalTax > 0 && payable === input.minTax
    };
  }

  /** Yearly tax payable as total income varies, all other settings held fixed. */
  static buildIncomeCurve(base: TaxInput, steps: number = 40): CurvePoint[] {
    const max = Math.max(base.totalIncome * 2, 3000000);
    const points: CurvePoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const totalIncome = Math.round((max * i) / steps);
      const result = this.calculateTax({...base, totalIncome});
      points.push({
        x: totalIncome,
        y: result.taxAfterRebate,
        totalTax: result.totalTax,
        rate: totalIncome > 0 ? (result.taxAfterRebate / totalIncome) * 100 : 0
      });
    }
    return points;
  }

  /** Monthly TDS as the monthly salary varies, keeping the same bonus-to-salary ratio. */
  static buildSalaryCurve(base: TaxInput, monthlySalary: number, bonusRatio: number, steps: number = 40): CurvePoint[] {
    const max = Math.max(monthlySalary * 2, 150000);
    const points: CurvePoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const salary = Math.round((max * i) / steps);
      const annual = salary * 12 + salary * bonusRatio;
      const result = this.calculateTax({...base, totalIncome: annual});
      points.push({
        x: salary,
        y: Math.round(result.taxAfterRebate / 12),
        totalTax: Math.round(result.totalTax / 12),
        rate: annual > 0 ? (result.taxAfterRebate / annual) * 100 : 0
      });
    }
    return points;
  }
}
