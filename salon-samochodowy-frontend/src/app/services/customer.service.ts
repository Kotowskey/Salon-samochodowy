// src/app/services/customer.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';

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

  private customersSubject: BehaviorSubject<Customer[]> = new BehaviorSubject<Customer[]>([]);
  public customers$ = this.customersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService // Inject AuthenticationService
  ) { 
    // Subscribe to currentUser$ to react to authentication changes
    this.authService.currentUser$.subscribe(user => {
      if (user && user.isDealer) {
        // Only load customers if the user is logged in and is a dealer/admin
        this.loadInitialData();
      } else {
        // Clear customers if not authorized
        this.customersSubject.next([]);
      }
    });
  }

  private loadInitialData(): void {
    this.http.get<Customer[]>(`${this.apiUrl}/users`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error loading customers:', error);
          return of([]); // Return an empty array on error
        })
      )
      .subscribe(
        (customers) => this.customersSubject.next(customers),
        (error) => console.error('Error loading customers:', error)
      );
  }

  getCustomers(): Observable<Customer[]> {
    return this.customers$;
  }

  addCustomer(newCustomer: NewCustomer): Observable<{ message: string, user: Customer }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<{ message: string, user: Customer }>(
      `${this.apiUrl}/admin/create-customer`, 
      newCustomer, 
      { headers, withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.user) {
          const currentCustomers = this.customersSubject.getValue();
          this.customersSubject.next([...currentCustomers, response.user]);
        }
      }),
      catchError(error => {
        console.error('Error adding customer:', error);
        throw error; // Re-throw the error after logging
      })
    );
  }
}
