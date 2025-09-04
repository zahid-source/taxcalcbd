import {Component, Input} from '@angular/core';
import {InputNumber} from "primeng/inputnumber";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TaxCalcService} from '../../services/tax-calc-service';

import {AY, AY_VALUE, TaxModel, TaxResult} from '../../models/model';
import {TAX_MODEL_25_26} from '../../models/ay25-26.model';
import {TAX_MODEL_26_27} from '../../models/ay26-27.model';

@Component({
  selector: 'app-ay25-26',
  imports: [
    InputNumber,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './tax-calculation.component.html',
  styleUrl: './tax-calculation.component.css'
})
export class TaxCalculation {

  @Input() ay!: AY_VALUE;

  taxModel: TaxModel = TAX_MODEL_25_26;

  //user-input
  monthlySalary: number = 0;
  festivalBonus: number = 0;
  totalIncome: number = 0;

  taxResult!: TaxResult;
  isShow: boolean = false;

  ngOnChanges() {
    this.isShow = false;
    if (!this.ay) {
      throw new Error('AY not provided!');
    }
    this.initializeFromModel();
  }

  private initializeFromModel() {

    // Load the correct model based on AY
    switch (this.ay) {
      case AY.AY_2025_2026:
        this.taxModel = TAX_MODEL_25_26;
        break;
      case AY.AY_2026_2027:
        this.taxModel = TAX_MODEL_26_27;
        break;
      default:
        throw new Error('Unsupported AY');
    }

  }

  calculate() {

    this.handleCalcInput();

    this.taxResult = TaxCalcService.calculateTax({
      totalIncome: this.totalIncome,
      taxFreeLimit: this.taxModel.taxFreeLimit,
      minTax: this.taxModel.minTax,
      slabs: this.taxModel.SLAB,
      exemptionRate: this.taxModel.EXEMPTION_RATE,
      maxExemption: this.taxModel.MAX_EXEMPTION,
      rebateRate: this.taxModel.REBATE_RATE,
      maxRebate: this.taxModel.MAX_REBATE,
    });

    console.log(this.taxResult);
    this.isShow = true;
  }


  private handleCalcInput() {
    this.taxModel.EXEMPTION_RATE = this.taxModel.exemptionBackup;
    if (this.taxModel.calcInput == this.taxModel.CALC_INPUT_ENUM.MONTHLY_SALARY)
      this.totalIncome = this.monthlySalary * 12 + this.festivalBonus;
    else if (this.taxModel.calcInput == this.taxModel.CALC_INPUT_ENUM.ONLY_SLAB) {
      this.monthlySalary = 0;
      this.festivalBonus = 0;
      this.taxModel.EXEMPTION_RATE = 0;
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
