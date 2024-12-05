// src/app/services/customer.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Customer {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isDealer: boolean;
}

export interface NewCustomer {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { } 

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/users`, { withCredentials: true });
  }

  // Aktualizacja endpointa na /admin/create-customer
  addCustomer(newCustomer: NewCustomer): Observable<{ message: string, user: Customer }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<{ message: string, user: Customer }>(`${this.apiUrl}/admin/create-customer`, newCustomer, { headers, withCredentials: true });
  }
}
