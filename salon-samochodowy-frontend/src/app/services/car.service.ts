// src/app/services/car.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  isAvailableForRent: boolean;
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

  constructor(private http: HttpClient) { } 

  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  addCar(newCar: Car): Observable<Car> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Car>(this.apiUrl, newCar, { headers, withCredentials: true });
  }
  updateCar(id: number, updatedCar: Car): Observable<Car> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Car>(`${this.apiUrl}/${id}`, updatedCar, { headers, withCredentials: true });
  }

  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
  leaseCar(carId: number, leasingData: LeasingRequest): Observable<LeasingResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<LeasingResponse>(`${this.apiUrl}/${carId}/leasing`,leasingData,{ headers });
  }

}
