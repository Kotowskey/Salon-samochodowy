// src/app/app.component.ts

import { Component } from '@angular/core';
import { CarListComponent } from './components/car-list/car-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CarListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'salon-samochodowy-frontend';
}
