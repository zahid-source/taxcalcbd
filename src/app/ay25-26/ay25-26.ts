import { Component } from '@angular/core';
import {InputNumber} from "primeng/inputnumber";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";


const EXEMPTION_RATE = 1 / 3;
const MAX_EXEMPTION = 500_000;
const REBATE_RATE = 0.03;

const MAX_REBATE = 10_00_000;

@Component({
  selector: 'app-ay25-26',
  imports: [
    InputNumber,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './ay25-26.html',
  styleUrl: './ay25-26.css'
})
export class Ay2526 {
  CALC_INPUT = {
    MONTHLY_SALARY: 'MONTHLY_SALARY',
    TOTAL_INCOME: 'TOTAL_INCOME'
  }
  taxFreeLimitOptions = [
    {label: '3,50,000 (Male)', value: 350000},
    {label: '4,00,000 (Female/65+ Age)', value: 400000},
    {label: '4,75,000 (Person with Disability /Third Gender)', value: 475000},
    {label: '5,00,000 (Freedom Fighter)', value: 500000}
  ];

  calcInputOptions = [
    {label: 'Monthly Salary', value: this.CALC_INPUT.MONTHLY_SALARY},
    {label: 'Total Income (yearly)', value: this.CALC_INPUT.TOTAL_INCOME}
  ];

  minTaxOptions = [
    {label: '3,000 (Without city corporation)', value: 3000},
    {label: '3,000 (Others city corporation)', value: 4000},
    {label: '5,000 (Dhaka/Chittagong city corporation)', value: 5000},
  ];

  isShow = false;

  //user-input-dropdown
  taxFreeLimit = 350000;
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
    this.totalTax = this.slab26_27V2(this.totalIncomeAfterExemption, this.taxFreeLimit);
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


  slab26_27V2(incomeAmount: number, taxFreeLimit: number): number {
    const taxableAmount = incomeAmount - taxFreeLimit;
    if (taxableAmount <= 0) return 0;

    const slabs = [
      { limit: 100000, rate: 0.05 },
      { limit: 400000, rate: 0.10 },
      { limit: 500000, rate: 0.15 },
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
