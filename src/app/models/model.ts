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
  rebateRateOnTaxableIncome: number;
  rebateRateOnActualInvestment: number;
  maxRebate: number;
}

export interface TaxResult {
  exemption: number;
  totalIncomeAfterExemption: number;
  maxRebate: number;
  totalTax: number;
  taxAfterRebate: number;
  monthlyTDS: number;
  investRequired: number;
  slabBreakDown: SlabBreakdown[];
}

export interface SlabOutput {
  breakdown: SlabBreakdown[];
  totalTax: number;
}

export interface RebateInput {
  totalIncomeAfterExemption: number;
  slabTax: number;
  rebateRateOnTaxableIncome: number;
  rebateRateOnActualInvestment: number;
  maxRebate: number;
  minTax: number;
}

export interface RebateOutput {
  taxAfterRebate: number;
  maxRebate: number;
  investRequired: number;
}

export const AY = {
  AY_2025_2026: '2025-2026',
  AY_2026_2027: '2026-2027',
  AY_2027_2028: '2027-2028',
  AY_2028_2029: '2028-2029',
  AY_2029_2030: '2029-2030',
  AY_2030_2031: '2030-2031'
} as const;

export type AY_VALUE = typeof AY[keyof typeof AY];

export const AY_OPTIONS: SelectItem[] = Object.entries(AY).map(([key, value]) => ({
  label: value,
  value: value,
}));

/**
 * Income year for an assessment year - it runs 01-07 to 30-06 of the two
 * calendar years before the AY closes, e.g. AY 2026-2027 -> 01-07-25 to 30-06-26.
 */
export function incomeYearOf(ay: AY_VALUE | string): string {
  const start = Number(String(ay).slice(0, 4));
  if (!start) return '';
  const yy = (year: number) => String(year % 100).padStart(2, '0');
  return '01-07-' + yy(start - 1) + ' to 30-06-' + yy(start);
}


export interface TaxModel {
  // Dropdown options
  TAX_FREE_LIMIT_OPTIONS: SelectItem[];
  CALC_INPUT_OPTIONS: SelectItem[];
  MIN_TAX_OPTIONS: SelectItem[];

  // Constants
  EXEMPTION_RATE: number;
  MAX_EXEMPTION: number;
  REBATE_RATE_ON_TAXABLE_INCOME: number;
  REBATE_RATE_ON_ACTUAL_INVESTMENT: number;
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

/* ---------------------------------------------------------------
 * Analytics & chart data
 * --------------------------------------------------------------- */

export interface TaxAnalytics {
  /** tax after rebate as a % of total income (the "average" / effective rate) */
  effectiveRate: number;
  /** tax after rebate as a % of income after exemption */
  effectiveRateOnTaxable: number;
  /** highest slab rate the income actually reaches */
  marginalRate: number;
  /** net income as a % of total income */
  takeHomeRate: number;
  /** rebate actually knocked off the slab tax */
  rebateApplied: number;
  /** investment needed to claim the rebate in full */
  investRequired: number;
  monthlyTDS: number;
  netMonthly: number;
  netAnnual: number;
  /** true when the floor (minimum tax) decided the payable amount */
  minTaxApplied: boolean;
}

export interface CurvePoint {
  x: number;
  /** tax payable after the rebate */
  y: number;
  /** slab tax before the rebate */
  totalTax: number;
  /** effective rate at this point, % */
  rate: number;
}

/** One slab line as the breakdown view renders it. */
export interface SlabRow {
  label: string;
  range: string;
  amount: number;
  rate: number;
  tax: number;
  /** share of the taxable income sitting in this slab, % */
  share: number;
  /** css custom property for the slab's ordinal colour */
  color: string;
}
