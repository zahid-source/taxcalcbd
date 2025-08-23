import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaxCalcService {


// ---------- Calculator ----------


  // Step 1
  static calculateExemption(totalIncome: number, exemptionRate: number, maxExemption: number): number {
    return Math.min(
      totalIncome * exemptionRate,
      maxExemption
    );
  }

  // Step 2
  static calculateSlabs(incomeAfterExemption: number, taxFreeLimit: number, slabs: Slab[]): SlabOutput {
    let remainingIncome = incomeAfterExemption;
    let breakdown: SlabBreakdown[] = [];
    let totalTax = 0;

    // Tax-free slab
    let taxFreeAmount = Math.min(remainingIncome, taxFreeLimit);

    breakdown.push({amount: taxFreeAmount, rate: 0, tax: 0});

    remainingIncome -= taxFreeAmount;


    for (let i = 0; i < slabs.length && remainingIncome > 0; i++) {
      const slab = slabs[i];
      const taxableAmount = Math.min(remainingIncome, slab.limit);

      const slabTax = taxableAmount * (slab.rate / 100);

      breakdown.push({amount: taxableAmount, rate: slab.rate, tax: slabTax});

      totalTax += slabTax;
      remainingIncome -= taxableAmount;
    }

    return {breakdown, totalTax};
  }

  // Step 3
  static applyRebate(input: RebateInput): RebateOutput {
    let maxRebate = input.totalIncomeAfterExemption * input.REBATE_RATE;
    maxRebate = Math.min(maxRebate, input.MAX_REBATE);

    let taxAfterRebate = input.totalTax - maxRebate;

    if (input.totalTax <= 0) {
      taxAfterRebate = 0;
      maxRebate = 0;
    } else if (taxAfterRebate <= input.minTax) {
      taxAfterRebate = input.minTax;
      maxRebate = 0;
    }

    return {taxAfterRebate, maxRebate};
  }

  static calculateTax(input: TaxInput): TaxResult {

    const exemption = this.calculateExemption(input.totalIncome, input.EXEMPTION_RATE, input.MAX_EXEMPTION);

    let totalIncomeAfterExemption = input.totalIncome - exemption;

    const slabResult: SlabOutput = this.calculateSlabs(
      totalIncomeAfterExemption,
      input.taxFreeLimit,
      input.slabs
    );

    const rebate: RebateOutput = this.applyRebate({
      totalIncomeAfterExemption,
      totalTax: slabResult.totalTax,
      REBATE_RATE: input.REBATE_RATE,
      MAX_REBATE: input.MAX_REBATE,
      minTax: input.minTax
    });

    const monthlyTDS = rebate.taxAfterRebate / 12;

    return {
      exemption,
      totalIncomeAfterExemption,
      maxRebate: rebate.maxRebate,
      totalTax: slabResult.totalTax,
      taxAfterRebate: rebate.taxAfterRebate,
      monthlyTDS,
      breakdown: slabResult.breakdown
    };
  }
}
