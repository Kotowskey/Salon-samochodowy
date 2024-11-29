// src/app/components/customer-list/customer-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CustomerService, Customer } from '../../services/customer.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  error: string = '';

  constructor(private customerService: CustomerService) { }

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => this.customers = data,
      error: (err) => this.error = err.message
    });
  }
}
