import {DISABLED_CHILD_OPTIONS, TaxModel} from './model';

/** Rules for AY 2030-2031. */
export const TAX_MODEL_30_31: TaxModel = {
  // Dropdown options
  TAX_FREE_LIMIT_OPTIONS: [
    {label: '5,00,000 (Male)', value: 500000},
    {label: '5,50,000 (Female/65+ Age)', value: 550000},
    {label: '6,25,000 (Person with Disability / Third Gender)', value: 625000},
    {label: '6,50,000 (Freedom Fighter)', value: 650000}
  ],

  DISABLED_CHILD_OPTIONS: DISABLED_CHILD_OPTIONS,

  CALC_INPUT_OPTIONS: [
    {label: 'Monthly Salary', value: 'MONTHLY_SALARY'},
    {label: 'Total Income (yearly)', value: 'TOTAL_INCOME'},
    {label: 'Only Slab Calculator', value: 'ONLY_SLAB'}
  ],

  MIN_TAX_OPTIONS: [
    {label: '1,000 (First Submission)', value: 1000},
    {label: '5,000 (Has Previous Submission)', value: 5000}
  ],

  // Constants
  EXEMPTION_RATE: 1 / 3,
  MAX_EXEMPTION: 500000,
  REBATE_RATE_ON_TAXABLE_INCOME: 0.03,
  REBATE_RATE_ON_ACTUAL_INVESTMENT: 0.1,
  MAX_REBATE: 750000,
  DISABLED_CHILD_ALLOWANCE: 50000,
  SLAB: [
    {limit: 300000, rate: 10},
    {limit: 400000, rate: 15},
    {limit: 500000, rate: 20},
    {limit: 2000000, rate: 25},
    {limit: 26300000, rate: 30},
    {limit: Infinity, rate: 35}
  ],

  // Enums (use direct values)
  CALC_INPUT_ENUM: {
    MONTHLY_SALARY: 'MONTHLY_SALARY',
    TOTAL_INCOME: 'TOTAL_INCOME',
    ONLY_SLAB: 'ONLY_SLAB'
  },
  MIN_TAX_ENUM: {
    FIRST_SUBMISSION: 1000,
    HAS_PREVIOUS_SUBMISSION: 5000
  },
  TAX_FREE_LIMIT_ENUM: {
    MALE: 500000,
    FEMALE_65_PLUS: 550000,
    DISABILITY_THIRD_GENDER: 625000,
    FREEDOM_FIGHTER: 650000
  },

  // User input selections (default values)
  taxFreeLimit: 500000,
  disabledChildren: 0,
  calcInput: 'MONTHLY_SALARY',
  minTax: 5000,

  // Backup values
  exemptionBackup: 1 / 3
};
