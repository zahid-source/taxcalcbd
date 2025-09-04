import {Component, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalculation} from './components/tax-calculation/tax-calculation.component';
import {AY, AY_OPTIONS} from './models/model';


@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, FormsModule, TaxCalculation],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App {
  // protected readonly title = signal('tax-calculator');
  AY: typeof AY = AY;
  selectedAy = AY_OPTIONS[AY_OPTIONS.length - 1].value;
  ayOptions = AY_OPTIONS;

  onAyChange() {
    console.log(this.selectedAy);
  }


}
