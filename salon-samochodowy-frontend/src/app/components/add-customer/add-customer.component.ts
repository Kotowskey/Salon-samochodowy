import { Component } from '@angular/core';
import { CustomerService, NewCustomer } from '../../services/customer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.css']
})
export class AddCustomerComponent {
  newCustomer: NewCustomer = {
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  };
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private customerService: CustomerService) { }

  addCustomer(): void {
    if (!this.newCustomer.username || !this.newCustomer.password || 
        !this.newCustomer.firstName || !this.newCustomer.lastName) {
      this.errorMessage = 'Proszę wypełnić wszystkie pola.';
      this.successMessage = '';
      return;
    }

    this.customerService.addCustomer(this.newCustomer).subscribe({
      next: (customer) => {
        this.successMessage = `Klient ${customer.firstName} ${customer.lastName} został dodany.`;
        this.errorMessage = '';
        this.newCustomer = { username: '', password: '', firstName: '', lastName: '' };
      },
      error: (err) => {
        this.errorMessage = err.error.error || 'Wystąpił błąd podczas dodawania klienta.';
        this.successMessage = '';
      }
    });
  }
}
