// src/app/services/car.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  horsePower: number;
  ownerId: number;
  renterId: number;
  isAvailableForRent: boolean;
}

export interface CarRenter {
  carId: number;
  renterId: number;
}

export interface LeasingRequest {
  downPayment: number;
  months: number;
}

export interface LeasingResponse {
  carId: number;
  carBrand: string;
  carModel: string;
  totalPrice: number;
  downPayment: number;
  remainingAmount: string;
  months: number;
  monthlyRate: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = 'http://localhost:3000/cars';
  
  // BehaviorSubject do przechowywania aktualnej listy samochodów
  private carsSubject: BehaviorSubject<Car[]> = new BehaviorSubject<Car[]>([]);
  public cars$ = this.carsSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.loadInitialData();
  }

  // Ładowanie początkowych danych
  private loadInitialData(): void {
    this.http.get<Car[]>(this.apiUrl)
      .subscribe(
        (cars) => this.carsSubject.next(cars),
        (error) => console.error('Błąd podczas ładowania samochodów:', error)
      );
  }

  getCars(): Observable<Car[]> {
    return this.cars$;
  }

  addCar(newCar: Car): Observable<Car> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Car>(this.apiUrl, newCar, { headers, withCredentials: true })
      .pipe(
        tap((car: Car) => {
          const currentCars = this.carsSubject.getValue();
          this.carsSubject.next([...currentCars, car]);
        })
      );
  }

  updateCar(id: number, updatedCar: Car): Observable<Car> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Car>(`${this.apiUrl}/${id}`, updatedCar, { headers, withCredentials: true })
      .pipe(
        tap((car: Car) => {
          const currentCars = this.carsSubject.getValue();
          const index = currentCars.findIndex(c => c.id === id);
          if (index !== -1) {
            currentCars[index] = car;
            this.carsSubject.next([...currentCars]);
          }
        })
      );
  }

  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(
        tap(() => {
          const currentCars = this.carsSubject.getValue();
          const updatedCars = currentCars.filter(car => car.id !== id);
          this.carsSubject.next(updatedCars);
        })
      );
  }

  rentCar(carId: number): Observable<any> {
    const url = `${this.apiUrl}/${carId}/rent`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, {}, { headers, withCredentials: true })
      .pipe(
        tap(() => {
          this.refreshCar(carId);
        })
      );
  }

  returnCar(carId: number): Observable<any> {
    const url = `${this.apiUrl}/${carId}/return`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, {}, { headers, withCredentials: true })
      .pipe(
        tap(() => {
          this.refreshCar(carId);
        })
      );
  }

  getRenterId(carId: number): Observable<CarRenter> {
    const url = `${this.apiUrl}/${carId}/renter`;
    return this.http.get<CarRenter>(url);
  }  

  leaseCar(carId: number, leasingData: LeasingRequest): Observable<LeasingResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<LeasingResponse>(`${this.apiUrl}/${carId}/leasing`, leasingData, { headers })
      .pipe(
        tap(() => {
          this.refreshCar(carId);
        })
      );
  }

  buyCar(carId: number): Observable<any> {
    const url = `${this.apiUrl}/${carId}/buy`; // Endpoint dla zakupu
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, {}, { headers, withCredentials: true })
      .pipe(
        tap(() => {
          this.refreshCar(carId);
        })
      );
  }

  // Pomocnicza metoda do odświeżania pojedynczego samochodu
  private refreshCar(carId: number): void {
    this.http.get<Car>(`${this.apiUrl}/${carId}`)
      .subscribe(
        (updatedCar) => {
          const currentCars = this.carsSubject.getValue();
          const index = currentCars.findIndex(c => c.id === carId);
          if (index !== -1) {
            currentCars[index] = updatedCar;
            this.carsSubject.next([...currentCars]);
          }
        },
        (error) => console.error(`Błąd podczas odświeżania samochodu o ID ${carId}:`, error)
      );
  }
}
