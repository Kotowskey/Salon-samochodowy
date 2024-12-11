import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable,BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RentalService {
  private baseUrl = 'http://localhost:3000/rentals';

  private rentalsSubject = new BehaviorSubject<any[]>([]);
  rentals$ = this.rentalsSubject.asObservable();

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

  loadRentals(): void {
    this.http.get<any[]>('http://localhost:3000/rentals',{ withCredentials: true }).subscribe(
      (data) => {
        this.rentalsSubject.next(data); // Aktualizuj wartość w BehaviorSubject
      },
      (error) => {
        console.error('Błąd przy pobieraniu wynajmów:', error);
      }
    );
  }

  // Opcjonalne: Dodaj metodę do ręcznej aktualizacji
  updateRentals(rentals: any[]): void {
    this.rentalsSubject.next(rentals);
  }
}
