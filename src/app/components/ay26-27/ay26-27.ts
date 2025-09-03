import {Component} from '@angular/core';
import {InputNumber} from "primeng/inputnumber";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import * as MODEL2627 from '../../models/ay26-27.model';
import {TaxCalcService} from '../../services/tax-calc-service';


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
  taxFreeLimitOptions = MODEL2627.TAX_FREE_LIMIT_OPTIONS;
  calcInputOptions = MODEL2627.CALC_INPUT_OPTIONS;
  minTaxOptions = MODEL2627.MIN_TAX_OPTIONS;
  slab = MODEL2627.SLAB;
  exemptionRate = MODEL2627.EXEMPTION_RATE;
  maxExemption = MODEL2627.MAX_EXEMPTION;
  rebateRate = MODEL2627.REBATE_RATE;
  maxRebate = MODEL2627.MAX_REBATE;

  CALC_INPUT_ENUM = MODEL2627.CALC_INPUT_ENUM;
  MIN_TAX_ENUM = MODEL2627.MIN_TAX_ENUM;
  TAX_FREE_LIMIT_ENUM = MODEL2627.TAX_FREE_LIMIT_ENUM;


  //user-input-dropdown
  taxFreeLimit = MODEL2627.TAX_FREE_LIMIT_ENUM.MALE;
  calcInput = this.CALC_INPUT_ENUM.MONTHLY_SALARY;
  minTax = MODEL2627.MIN_TAX_ENUM.HAS_PREVIOUS_SUBMISSION;


  //user-input
  monthlySalary = 0;
  festivalBonus = 0;
  totalIncome = 0;

  taxResult!: TaxResult;
  isShow = false;

  calculate() {
    this.isShow = true;
    this.handleCalcInput();

    this.taxResult = TaxCalcService.calculateTax({
      totalIncome: this.totalIncome,
      taxFreeLimit: this.taxFreeLimit,
      minTax: this.minTax,
      slabs: this.slab,
      exemptionRate: this.exemptionRate,
      maxExemption: this.maxExemption,
      rebateRate: this.rebateRate,
      maxRebate: this.maxRebate,
    });

    console.log(this.taxResult);

  }


  private handleCalcInput() {
    this.exemptionRate = MODEL2627.EXEMPTION_RATE;
    if (this.calcInput == this.CALC_INPUT_ENUM.MONTHLY_SALARY)
      this.totalIncome = this.monthlySalary * 12 + this.festivalBonus;
    else if (this.calcInput == this.CALC_INPUT_ENUM.ONLY_SLAB) {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
      this.exemptionRate = 0;
    } else {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
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
