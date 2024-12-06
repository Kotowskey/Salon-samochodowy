import { Component, OnInit } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.css'],
})
export class CarListComponent implements OnInit {
  isDealer = false;
  logged = false;
  userId = -1;
  brandserch = '';
  cars: Car[] = [];
  ownedCars: Car[] = [];
  sortedCars: Car[] = [];
  filteredCars: Car[] = [];
  sortDirection: 'asc' | 'desc' = 'asc';
  sortHorsePowerDirection: 'asc' | 'desc' = 'asc';

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.carService.getCars().subscribe((data) => {
      this.cars = data;
      this.sortedCars = this.cars.filter((car) => car.ownerId == null).map((car) => ({ ...car }));
      this.filterCars();
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
    this.filterCars();
  }

  sortByHorsePower(): void {
    if (this.sortHorsePowerDirection === 'asc') {
      this.sortedCars.sort((a, b) => a.horsePower - b.horsePower);
      this.sortHorsePowerDirection = 'desc';
    } else {
      this.sortedCars.sort((a, b) => b.horsePower - a.horsePower);
      this.sortHorsePowerDirection = 'asc';
    }
    this.filterCars();
  }

  onBrandSearchChange(): void {
    this.filterCars();
  }

  filterCars(): void {
    this.filteredCars = this.sortedCars.filter((car) =>
      car.brand.toLowerCase().includes(this.brandserch.toLowerCase())
    );
  }
}
