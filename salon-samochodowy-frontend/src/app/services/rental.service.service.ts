import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RentalService {
  private baseUrl = 'http://localhost:3000/rentals';

  constructor(private http: HttpClient) {}

  addRental(carId: number, startDate: Date, endDate: Date): Observable<any> {
    return this.http.post(`${this.baseUrl}`, { carId, startDate, endDate },{ withCredentials: true });
  }

  getRentals(): Observable<any> {
    return this.http.get(`${this.baseUrl}`,{ withCredentials: true });
  }

  removeRental(rentalId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${rentalId}`,{ withCredentials: true });
  }
}
