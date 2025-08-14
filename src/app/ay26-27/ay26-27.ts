import {Component} from '@angular/core';
import {InputNumber} from "primeng/inputnumber";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

const EXEMPTION_RATE = 1 / 3;
const MAX_EXEMPTION = 500_000;
const REBATE_RATE = 0.03;

const MAX_REBATE = 10_00_000;

@Component({
  selector: 'app-ay26-27',
  imports: [
    InputNumber,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './ay26-27.html',
  styleUrl: './ay26-27.css'
})
export class Ay2627 {
  CALC_INPUT = {
    MONTHLY_SALARY: 'MONTHLY_SALARY',
    TOTAL_INCOME: 'TOTAL_INCOME'
  }
  taxFreeLimitOptions = [
    {label: '3,75,000 (Male)', value: 375000},
    {label: '4,25,000 (Female)', value: 425000},
    {label: '5,00,000 (Person with Disability /Third Gender)', value: 500000},
    {label: '5,25,000 (Freedom Fighter)', value: 525000}
  ];

  calcInputOptions = [
    {label: 'Monthly Salary', value: this.CALC_INPUT.MONTHLY_SALARY},
    {label: 'Total Income (yearly)', value: this.CALC_INPUT.TOTAL_INCOME}
  ];

  minTaxOptions = [
    {label: '1,000 (First Submission)', value: 1000},
    {label: '5,000 (Has Previous Submission)', value: 5000},
  ];

  isShow = false;

  //user-input-dropdown
  taxFreeLimit = 375000;
  calcInput = this.CALC_INPUT.MONTHLY_SALARY;
  minTax = 5000;


  //user-input
  monthlySalary = 0;
  festivalBonus = 0;
  totalIncome = 0;

  totalIncomeAfterExemption = 0;
  totalTax = 0;
  taxAfterRebate = 0;
  monthlyTDS = 0;
  maxRebate = 0;
  exemption = 0;



  calculate() {
    this.isShow = true;

    // Step 1: Calculate total income
    if (this.calcInput == this.CALC_INPUT.MONTHLY_SALARY)
      this.totalIncome = this.monthlySalary * 12 + this.festivalBonus;
    else {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
    }

    // Step 2: Apply exemption (max cap: 500,000)
    this.exemption = Math.min(this.totalIncome * EXEMPTION_RATE, MAX_EXEMPTION);

    // Step 3: Calculate taxable income
    this.totalIncomeAfterExemption = this.totalIncome - this.exemption;

    // Step 4: Calculate rebate

    this.maxRebate = this.totalIncomeAfterExemption * REBATE_RATE;
    this.maxRebate = Math.min(this.maxRebate, MAX_REBATE);

    // Step 5: Calculate total tax before rebate
    this.totalTax = this.slab26_27(this.totalIncomeAfterExemption, this.taxFreeLimit);
    this.taxAfterRebate = this.totalTax - this.maxRebate;

    if (this.totalTax <= 0) {
      this.taxAfterRebate = 0;
      this.totalTax = 0;
      this.maxRebate = 0;
    } else if (this.taxAfterRebate <= this.minTax) {
      this.taxAfterRebate = this.minTax;
      this.totalTax = this.minTax;
      this.maxRebate = 0;
    }

    this.monthlyTDS = this.taxAfterRebate / 12;
  }

  slab26_27(incomeAmount: number, taxFreeLimit: number): number {

    const taxableAmount = incomeAmount - taxFreeLimit;

    if (taxableAmount <= 0) return 0;

    if (taxableAmount > 3200000) {
      return (taxableAmount - 3200000) * 0.3 + 690000;
    } else if (taxableAmount > 1200000) {
      return (taxableAmount - 1200000) * 0.25 + 190000;
    } else if (taxableAmount > 700000) {
      return (taxableAmount - 700000) * 0.2 + 90000;
    } else if (taxableAmount > 300000) {
      return (taxableAmount - 300000) * 0.15 + 30000;
    } else {
      return taxableAmount * 0.1;
    }
  }

  slab26_27V2(incomeAmount: number, taxFreeLimit: number): number {
    const taxableAmount = incomeAmount - taxFreeLimit;
    if (taxableAmount <= 0) return 0;

    const slabs = [
      { limit: 300000, rate: 0.10 },
      { limit: 400000, rate: 0.15 },
      { limit: 500000, rate: 0.20 },
      { limit: 2000000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ];

    let remaining = taxableAmount;
    let tax = 0;

    for (const slab of slabs) {
      if (remaining <= 0) break;

      const taxableInSlab = Math.min(remaining, slab.limit);
      tax += taxableInSlab * slab.rate;
      remaining -= taxableInSlab;
    }

    return tax;
  }

  formatIndianNumber(amount: number): string {
    const amt = Math.round(amount).toString();
    if (amt.length <= 3) return amt;
    const last3 = amt.slice(-3);
    let rest = amt.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + ',' + last3;
  }

  calcFestival() {
    this.festivalBonus = this.monthlySalary * 1.2;
  }
}
