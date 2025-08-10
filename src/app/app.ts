import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('tax-calculator');
  monthlySalary = 0;
  taxFreeLimit = 375000;

  totalIncome = 0;
  totalIncomeAfterExemption = 0;
  totalTax = 0;
  minTax = 0;
  monthlyTDS = 0;
  isShow = false;

  calculate() {
    this.isShow = true;
    const gross = this.monthlySalary * 13.2;
    let exemption = gross / 3.0;
    if (exemption > 500000) exemption = 500000;

    const incomeAfterExemption = gross - exemption;
    let minTax = 0;

    const tax = this.slab_2024_2025(incomeAfterExemption, this.taxFreeLimit);
    let maxRebate = incomeAfterExemption * 0.03;
    if(tax == 0){
      maxRebate = 0;
      minTax = 0;
    }
    else if (maxRebate > tax) {
      maxRebate = 0;
      minTax = 5000;
    } else {
      minTax = tax - maxRebate;
    }


    this.totalIncome = gross;
    this.totalIncomeAfterExemption = incomeAfterExemption;
    this.totalTax = tax;
    this.minTax = minTax;
    this.monthlyTDS = minTax / 12;
  }

  slab_2024_2025(incomeAmount: number, taxFreeLimit: number): number {
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

  formatIndianNumber(amount: number): string {
    const amt = Math.round(amount).toString();
    if (amt.length <= 3) return amt;
    const last3 = amt.slice(-3);
    let rest = amt.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + ',' + last3;
  }
}
