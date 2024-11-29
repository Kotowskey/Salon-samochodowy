import { Component } from '@angular/core';
import { CarListComponent } from './components/car-list/car-list.component';
import { AddCarComponent } from "./components/add-car/add-car.component";
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { AddCustomerComponent } from './components/add-customer/add-customer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CarListComponent, AddCarComponent, CustomerListComponent, AddCustomerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'salon-samochodowy-frontend';
}
