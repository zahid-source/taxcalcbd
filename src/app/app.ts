import {Component, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {InputNumber} from 'primeng/inputnumber';



@Component({
  selector: 'app-root',
  imports: [FormsModule, NgIf, InputNumber, NgForOf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App {
  protected readonly title = signal('tax-calculator');
  monthlySalary = 0;
  festivalBonus = 0;
  taxFreeLimit = 375000;

  totalIncome = 0;
  totalIncomeAfterExemption = 0;
  totalTax = 0;
  taxAfterRebate = 0;
  minTax = 5000;
  monthlyTDS = 0;
  isShow = false;
  taxFreeLimitOptions = [
    {label: '3,75,000 (Male)', value: 375000},
    {label: '4,25,000 (Female)', value: 425000},
    {label: '5,00,000 (Person with Disability /Third Gender)', value: 500000},
    {label: '5,25,000 (Freedom Fighter)', value: 525000}
  ];

  minTaxOptions = [
    {label: '5,000 (Has Previous Submission)', value: 5000},
    {label: '1,000 (First Submission)', value: 1000},
  ];


  calculate() {
    this.isShow = true;
    const gross = this.monthlySalary * 12 + this.festivalBonus;
    let exemption = gross / 3.0;
    if (exemption > 500000) exemption = 500000;

    const incomeAfterExemption = gross - exemption;
    let taxAfterRebate: number;

    let tax = this.slab26_27(incomeAfterExemption, this.taxFreeLimit);
    let maxRebate = incomeAfterExemption * 0.03;
    taxAfterRebate = tax - maxRebate;
    if (tax <= 0) {
      taxAfterRebate = 0;
      tax = 0;
    } else if (taxAfterRebate <= this.minTax) {
      taxAfterRebate = this.minTax;
      tax = this.minTax;
    } else {
      taxAfterRebate = tax - maxRebate;
    }


    this.totalIncome = gross;
    this.totalIncomeAfterExemption = incomeAfterExemption;
    this.totalTax = tax;
    this.taxAfterRebate = taxAfterRebate;
    this.monthlyTDS = taxAfterRebate / 12;
  }

  slab26_27(incomeAmount: number, taxFreeLimit: number): number {
    console.log(incomeAmount);
    console.log(taxFreeLimit);
    const taxableAmount = incomeAmount - taxFreeLimit;
    console.log(taxableAmount);
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
