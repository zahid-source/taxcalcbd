import {SelectItem} from 'primeng/api';

export interface Slab {
  limit: number;
  rate: number;
}

export interface SlabBreakdown {
  amount: number;
  rate: number;
  tax: number;
}

export interface TaxInput {
  totalIncome: number;
  taxFreeLimit: number;
  slabs: Slab[];
  minTax: number;
  exemptionRate: number;
  maxExemption: number;
  rebateRate: number;
  maxRebate: number;
}

export interface TaxResult {
  exemption: number;
  totalIncomeAfterExemption: number;
  maxRebate: number;
  totalTax: number;
  taxAfterRebate: number;
  monthlyTDS: number;
  slabBreakDown: SlabBreakdown[];
}

export interface SlabOutput {
  breakdown: SlabBreakdown[];
  totalTax: number;
}

export interface RebateInput {
  totalIncomeAfterExemption: number;
  slabTax: number;
  rebateRate: number;
  maxRebate: number;
  minTax: number;
}

export interface RebateOutput {
  taxAfterRebate: number;
  maxRebate: number;
}

export const AY = {
  AY_2025_2026: '2025-2026',
  AY_2026_2027: '2026-2027'
} as const;

export type AY_VALUE = typeof AY[keyof typeof AY];

export const AY_OPTIONS: SelectItem[] = Object.entries(AY).map(([key, value]) => ({
  label: value,
  value: value,
}));


export interface TaxModel {
  // Dropdown options
  TAX_FREE_LIMIT_OPTIONS: SelectItem[];
  CALC_INPUT_OPTIONS: SelectItem[];
  MIN_TAX_OPTIONS: SelectItem[];

  // Constants
  EXEMPTION_RATE: number;
  MAX_EXEMPTION: number;
  REBATE_RATE: number;
  MAX_REBATE: number;
  SLAB: Slab[];

  // Enums
  CALC_INPUT_ENUM: any;
  MIN_TAX_ENUM: any;
  TAX_FREE_LIMIT_ENUM: any;

  // User input selections
  taxFreeLimit: number;
  calcInput: string;
  minTax: number;

  // Backup values
  exemptionBackup: number;
}
