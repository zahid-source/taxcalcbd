import {TaxModel} from './model';
export const TAX_MODEL_26_27: TaxModel = {
  // Dropdown options
  TAX_FREE_LIMIT_OPTIONS: [
    {label: '3,75,000 (Male)', value: 375000},
    {label: '4,25,000 (Female/65+ Age)', value: 425000},
    {label: '5,00,000 (Person with Disability / Third Gender)', value: 500000},
    {label: '5,25,000 (Freedom Fighter)', value: 525000}
  ],

  CALC_INPUT_OPTIONS: [
    { label: 'Monthly Salary', value: 'MONTHLY_SALARY' },
    { label: 'Total Income (yearly)', value: 'TOTAL_INCOME' },
    { label: 'Only Slab Calculator', value: 'ONLY_SLAB' }
  ],

  MIN_TAX_OPTIONS: [
    {label: '1,000 (First Submission)', value: 1000},
    {label: '5,000 (Has Previous Submission)', value: 5000},
  ],

  // Constants
  EXEMPTION_RATE: 1 / 3,
  MAX_EXEMPTION: 500000,
  REBATE_RATE: 0.03,
  MAX_REBATE: 1000000,
  SLAB: [
    { limit: 300000, rate: 10 },
    { limit: 400000, rate: 15 },
    { limit: 500000, rate: 20 },
    { limit: 2000000, rate: 25 },
    { limit: Infinity, rate: 30 }
  ],

  // Enums (use direct values)
  CALC_INPUT_ENUM: {
    MONTHLY_SALARY: 'MONTHLY_SALARY',
    TOTAL_INCOME: 'TOTAL_INCOME',
    ONLY_SLAB: 'ONLY_SLAB'
  },
  MIN_TAX_ENUM: {
    FIRST_SUBMISSION : 1000,
    HAS_PREVIOUS_SUBMISSION : 5000
  },
  TAX_FREE_LIMIT_ENUM: {
    MALE : 375000,
    FEMALE_65_PLUS : 425000,
    DISABILITY_THIRD_GENDER : 500000,
    FREEDOM_FIGHTER : 525000
  },

  // User input selections (default values)
  taxFreeLimit: 375000,
  calcInput: 'MONTHLY_SALARY',
  minTax: 5000,

  // Backup values
  exemptionBackup: 1 / 3
};
