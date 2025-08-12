import {Component, signal} from '@angular/core';
import {Ay2627} from './ay26-27/ay26-27';


@Component({
  selector: 'app-root',
  imports: [Ay2627],
  templateUrl: './app.html',
  styleUrl: './app.css'
})


export class App {
  protected readonly title = signal('tax-calculator');

}
