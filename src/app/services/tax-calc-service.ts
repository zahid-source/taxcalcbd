import {Injectable} from '@angular/core';
import {RebateInput, RebateOutput, Slab, SlabBreakdown, SlabOutput, TaxInput, TaxResult} from '../models/model';

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
    let maxRebate = input.totalIncomeAfterExemption * input.rebateRate;
    maxRebate = Math.min(maxRebate, input.maxRebate);
    maxRebate = Math.round(maxRebate);
    let taxAfterRebate = input.totalTax - maxRebate;
    if (input.totalTax <= 0) {
      taxAfterRebate = 0;
      maxRebate = 0;
    } else if (taxAfterRebate <= input.minTax) {
      taxAfterRebate = input.minTax;
      maxRebate = 0;
    }
    taxAfterRebate = Math.round(taxAfterRebate);

    return {
      taxAfterRebate: taxAfterRebate,
      maxRebate: maxRebate
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
      totalTax: slabResult.totalTax,
      rebateRate: input.rebateRate,
      maxRebate: input.maxRebate,
      minTax: input.minTax
    });

    return {
      exemption,
      totalIncomeAfterExemption,
      maxRebate: rebate.maxRebate,
      totalTax: slabResult.totalTax,
      taxAfterRebate: rebate.taxAfterRebate,
      monthlyTDS: Math.round(rebate.taxAfterRebate / 12),
      slabBreakDown: slabResult.breakdown
    };
  }
}
