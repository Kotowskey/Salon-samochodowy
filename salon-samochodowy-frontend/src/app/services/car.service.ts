import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Car {
    id: number;
    brand: string;
    model: string;
    year: string;
    vin: string;
    rent: number;
    sold: boolean;
    price: number;
    ownerId: number;
}

@Injectable({
    providedIn: 'root'
})
export class CarService {
    private apiUrl = 'http://localhost:3000/api/cars';

    constructor(private http: HttpClient) { }

    getCars(): Observable<Car[]> {
        return this.http.get<Car[]>(this.apiUrl);
    }

    // Możesz dodać więcej metod (getCarById, addCar, etc.)
}
