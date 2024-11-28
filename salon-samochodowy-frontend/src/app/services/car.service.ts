import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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


    constructor(private http_client: HttpClient) { }

    getCars(): Observable<Car[]> {
        const fetchPromise = fetch(this.apiUrl)
            .then(response => response.json())
            .then(data => data as Car[]);
        return from(fetchPromise);
    }

    addCar(newCar: Car): Observable<Car> {
        const fetchPromise = fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCar)
        })
            .then(response => response.json())
            .then(data => data as Car);
        return from(fetchPromise);
    }

    
}
