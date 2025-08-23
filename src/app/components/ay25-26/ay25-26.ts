import { Component } from '@angular/core';
import {InputNumber} from "primeng/inputnumber";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TaxCalcService} from '../../services/tax-calc-service';


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
  calcInput = this.CALC_INPUT.TOTAL_INCOME;
  minTax = 5000;


  //user-input
  monthlySalary = 0;
  festivalBonus = 0;
  totalIncome = 0;

  taxResult!: TaxResult;


  calculate() {
    this.isShow = true;

    // Step 1: Calculate total income
    if (this.calcInput == this.CALC_INPUT.MONTHLY_SALARY)
      this.totalIncome = this.monthlySalary * 12 + this.festivalBonus;
    else {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
    }
    this.taxResult = TaxCalcService.calculateTax({
      totalIncome: this.totalIncome,
      taxFreeLimit: this.taxFreeLimit,
      minTax: this.minTax,
      slabs: [
        { limit: 100000, rate: 5 },
        { limit: 400000, rate: 10 },
        { limit: 500000, rate: 15 },
        { limit: 500000, rate: 20 },
        { limit: 2000000, rate: 25 },
        { limit: Infinity, rate: 30 }// last slab = no limit
      ],
      EXEMPTION_RATE: EXEMPTION_RATE,
      MAX_EXEMPTION: MAX_EXEMPTION,
      REBATE_RATE: REBATE_RATE,
      MAX_REBATE: MAX_REBATE,
    });

    console.log(this.taxResult);

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
