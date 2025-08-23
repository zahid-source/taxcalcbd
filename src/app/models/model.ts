type Slab = {
    limit: number;   // income limit for this slab
    rate: number;    // tax rate in PERCENT (e.g., 5 for 5%)
};

type SlabBreakdown = {
    amount: number;
    rate: number;
    tax: number;            // tax for this slab
};

type TaxInput = {
    totalIncome: number;
    taxFreeLimit: number;
    slabs: Slab[]; // slab array AFTER tax-free limit
    EXEMPTION_RATE: number;
    MAX_EXEMPTION: number;
    REBATE_RATE: number;
    MAX_REBATE: number;
    minTax: number;
};

type TaxResult = {
    exemption: number;
    totalIncomeAfterExemption: number;
    maxRebate: number;
    totalTax: number;
    taxAfterRebate: number;
    monthlyTDS: number;
    breakdown: SlabBreakdown[];
};
// ---------- Models ----------


// Step 1: Exemption models
type ExemptionInput = Pick<TaxInput, 'totalIncome' | 'EXEMPTION_RATE' | 'MAX_EXEMPTION'>;
type ExemptionOutput = {
    exemption: number;
    totalIncomeAfterExemption: number;
};

// Step 2: Slab calculation models
type SlabInput = {
    incomeAfterExemption: number;
    taxFreeLimit: number;
    slabs: Slab[];
};
type SlabOutput = {
    breakdown: SlabBreakdown[];
    totalTax: number;
};

// Step 3: Rebate models
type RebateInput = {
    totalIncomeAfterExemption: number;
    totalTax: number;
    REBATE_RATE: number;
    MAX_REBATE: number;
    minTax: number;
};
type RebateOutput = {
    taxAfterRebate: number;
    maxRebate: number;
};
