import {TaxModel} from './model';

export const TAX_MODEL_25_26: TaxModel = {
  // Dropdown options
  TAX_FREE_LIMIT_OPTIONS: [
    {label: '3,50,000 (Male)', value: 350000},
    {label: '4,00,000 (Female/65+ Age)', value: 400000},
    {label: '4,75,000 (Person with Disability / Third Gender)', value: 475000},
    {label: '5,00,000 (Freedom Fighter)', value: 500000}
  ],

  CALC_INPUT_OPTIONS: [
    {label: 'Monthly Salary', value: 'MONTHLY_SALARY'},
    {label: 'Total Income (yearly)', value: 'TOTAL_INCOME'},
    {label: 'Only Slab Calculator', value: 'ONLY_SLAB'}
  ],

  MIN_TAX_OPTIONS: [
    {label: '3,000 (Without city corporation)', value: 3000},
    {label: '4,000 (Other city corporations)', value: 4000},
    {label: '5,000 (Dhaka/Chittagong city corporations)', value: 5000}
  ],

  // Constants
  EXEMPTION_RATE: 1 / 3,
  MAX_EXEMPTION: 500000,
  REBATE_RATE: 0.03,
  MAX_REBATE: 1000000,
  SLAB: [
    {limit: 100000, rate: 5},
    {limit: 400000, rate: 10},
    {limit: 500000, rate: 15},
    {limit: 500000, rate: 20},
    {limit: 2000000, rate: 25},
    {limit: Infinity, rate: 30}
  ],

  // Enums (use direct values)
  CALC_INPUT_ENUM: {
    MONTHLY_SALARY: 'MONTHLY_SALARY',
    TOTAL_INCOME: 'TOTAL_INCOME',
    ONLY_SLAB: 'ONLY_SLAB'
  },
  MIN_TAX_ENUM: {
    WITHOUT_CITY_CORPORATION: 3000,
    OTHER_CITY_CORPORATIONS: 4000,
    DHAKA_CHITTAGONG: 5000
  },
  TAX_FREE_LIMIT_ENUM: {
    MALE: 350000,
    FEMALE_65_PLUS: 400000,
    DISABILITY_THIRD_GENDER: 475000,
    FREEDOM_FIGHTER: 500000
  },

  // User input selections (default values)
  taxFreeLimit: 350000,
  calcInput: 'MONTHLY_SALARY',
  minTax: 5000,

  // Backup values
  exemptionBackup: 1 / 3
};
