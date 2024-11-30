// customer.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Customer {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isDealer: boolean;
  // Nie wysyłamy hasła do frontendu ze względów bezpieczeństwa
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

  addCustomer(newCustomer: NewCustomer): Observable<Customer> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Customer>(`${this.apiUrl}/register`, newCustomer, { headers, withCredentials: true });
  }
}
