type Slab = {
  limit: number;
  rate: number;
};

type SlabBreakdown = {
  amount: number;
  rate: number;
  tax: number;
};

type TaxInput = {
  totalIncome: number;
  taxFreeLimit: number;
  slabs: Slab[];
  minTax: number;
  exemptionRate: number;
  maxExemption: number;
  rebateRate: number;
  maxRebate: number;
};

type TaxResult = {
  exemption: number;
  totalIncomeAfterExemption: number;
  maxRebate: number;
  totalTax: number;
  taxAfterRebate: number;
  monthlyTDS: number;
  slabBreakDown: SlabBreakdown[];
};

type SlabOutput = {
  breakdown: SlabBreakdown[];
  totalTax: number;
};

type RebateInput = {
  totalIncomeAfterExemption: number;
  totalTax: number;
  rebateRate: number;
  maxRebate: number;
  minTax: number;
};

type RebateOutput = {
  taxAfterRebate: number;
  maxRebate: number;
};
