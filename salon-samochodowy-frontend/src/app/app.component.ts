// src/app/app.component.ts

import { Component } from '@angular/core';
import { CarListComponent } from './components/car-list/car-list.component';
import { AddCarComponent } from "./components/add-car/add-car.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CarListComponent, AddCarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'salon-samochodowy-frontend';
}
