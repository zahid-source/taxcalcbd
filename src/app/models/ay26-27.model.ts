// Enum for calculation input types
export enum CALC_INPUT_ENUM {
  MONTHLY_SALARY = 'MONTHLY_SALARY',
  TOTAL_INCOME = 'TOTAL_INCOME',
  ONLY_SLAB = 'ONLY_SLAB'
}


export enum TAX_FREE_LIMIT_ENUM {
  MALE = 375000,
  FEMALE_65_PLUS = 425000,
  DISABILITY_THIRD_GENDER = 500000,
  FREEDOM_FIGHTER = 525000
}

// Tax-free limit options
export const TAX_FREE_LIMIT_OPTIONS = [
  {label: '3,75,000 (Male)', value: TAX_FREE_LIMIT_ENUM.MALE},
  {label: '4,25,000 (Female/65+ Age)', value: TAX_FREE_LIMIT_ENUM.FEMALE_65_PLUS},
  {label: '5,00,000 (Person with Disability / Third Gender)', value: TAX_FREE_LIMIT_ENUM.DISABILITY_THIRD_GENDER},
  {label: '5,25,000 (Freedom Fighter)', value: TAX_FREE_LIMIT_ENUM.FREEDOM_FIGHTER}
];


// Calculation input options
export const CALC_INPUT_OPTIONS = [
  {label: 'Monthly Salary', value: CALC_INPUT_ENUM.MONTHLY_SALARY},
  {label: 'Total Income (yearly)', value: CALC_INPUT_ENUM.TOTAL_INCOME},
  {label: 'Only Slab Calculator', value: CALC_INPUT_ENUM.ONLY_SLAB}
];

// Enum for minimum tax categories
export enum MIN_TAX_ENUM {
  FIRST_SUBMISSION = 1000,
  HAS_PREVIOUS_SUBMISSION = 5000
}

// Minimum tax options
export const MIN_TAX_OPTIONS = [
  {label: '1,000 (First Submission)', value: MIN_TAX_ENUM.FIRST_SUBMISSION},
  {label: '5,000 (Has Previous Submission)', value: MIN_TAX_ENUM.HAS_PREVIOUS_SUBMISSION},
];


// Tax slabs for AY 25-26
export const SLAB = [
  { limit: 300000, rate: 10 },
  { limit: 400000, rate: 15 },
  { limit: 500000, rate: 20 },
  { limit: 2000000, rate: 25 },
  { limit: Infinity, rate: 30 }
];

// Exemption & Rebate constants
export const EXEMPTION_RATE = 1 / 3;
export const MAX_EXEMPTION = 500_000;
export const REBATE_RATE = 0.03;
export const MAX_REBATE = 1_000_000;
