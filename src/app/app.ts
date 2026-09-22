import {Component, inject} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaxCalculation} from './components/tax-calculation/tax-calculation.component';
import {AY, AY_OPTIONS} from './models/model';
import {ThemeService} from './services/theme-service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, FormsModule, TaxCalculation],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  AY: typeof AY = AY;
  selectedAy = AY_OPTIONS[AY_OPTIONS.length - 1].value;
  ayOptions = AY_OPTIONS;

  readonly themeService = inject(ThemeService);

  get isDark(): boolean {
    return this.themeService.theme() === 'dark';
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  onAyChange() {
    // model is reloaded by the child component through ngOnChanges
  }

  print() {
    window.print();
  }
}
