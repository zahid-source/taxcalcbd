import {Component, signal} from '@angular/core';
import {Ay2627} from './ay26-27/ay26-27';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Ay2526} from './ay25-26/ay25-26';


@Component({
  selector: 'app-root',
  imports: [Ay2627, ReactiveFormsModule, FormsModule, Ay2526],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App {
  protected readonly title = signal('tax-calculator');
  ay = 2;
  ayOptions = [
    {label: '2025-2026', value: 1},
    {label: '2026-2027', value: 2},
  ];

  onAyChange() {
    console.log(this.ay);
  }
}
