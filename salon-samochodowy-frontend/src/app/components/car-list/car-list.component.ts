import { Component, OnInit } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditCarComponent } from '../edit-car/edit-car.component';

@Component({
    selector: 'app-car-list',
    standalone: true,
    imports: [CommonModule, FormsModule, EditCarComponent],
    templateUrl: './car-list.component.html',
    styleUrls: ['./car-list.component.css']
})
export class CarListComponent implements OnInit {
    cars: Car[] = [];
    sortedCars: Car[] = [];
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(private carService: CarService) { }

    ngOnInit(): void {
        this.carService.getCars().subscribe(data => {
            this.cars = data;
            this.sortedCars = [...this.cars];
        });
    }

    sortByPrice(): void {
        if (this.sortDirection === 'asc') {
            this.sortedCars.sort((a, b) => a.price - b.price);
            this.sortDirection = 'desc';
        } else {
            this.sortedCars.sort((a, b) => b.price - a.price);
            this.sortDirection = 'asc';
        }
    }
}
