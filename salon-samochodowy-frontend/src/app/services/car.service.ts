// src/app/services/car.service.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    vin: string;
    price: number;
    isAvailableForRent: boolean;
}


@Injectable({
    providedIn: 'root'
})
export class CarService {
    private apiUrl = 'http://localhost:3000/cars';


    constructor() { }

    getCars(): Observable<Car[]> {
        const fetchPromise = fetch(this.apiUrl)
            .then(response => response.json())
            .then(data => data as Car[]);
        return from(fetchPromise);
    }

    // Dodatkowe metody (getCarById, addCar, etc.) mogą być dodane analogicznie
}
