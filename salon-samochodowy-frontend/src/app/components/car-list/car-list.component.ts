import { Component, OnInit } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditCarComponent } from '../edit-car/edit-car.component';
import { AuthenticationService } from '../../services/authentication.service';
import { RentCarComponent } from '../rent-car/rent-car.component';
import { CalculateLeasingComponent } from '../calculate-leasing/calculate-leasing.component';
@Component({
    selector: 'app-car-list',
    standalone: true,
    imports: [CommonModule, FormsModule, EditCarComponent,RentCarComponent,CalculateLeasingComponent],
    templateUrl: './car-list.component.html',
    styleUrls: ['./car-list.component.css']
})
export class CarListComponent implements OnInit {
    isDealer = false;
    cars: Car[] = [];
    sortedCars: Car[] = [];
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(private carService: CarService, private authService: AuthenticationService) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe((user) => {
            this.isDealer = user?.isDealer ?? false;
          });
        
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

    deleteCar(id: number): void {
        if (!this.isDealer) {
          alert('Nie masz uprawnień do usuwania samochodów.');
          return;
        }
    
        if (confirm('Czy na pewno chcesz usunąć ten samochód?')) {
          this.carService.deleteCar(id).subscribe(
            () => {
              this.cars = this.cars.filter((car) => car.id !== id);
              this.sortedCars = this.sortedCars.filter((car) => car.id !== id);
              alert('Samochód został usunięty.');
            },
            (error) => {
              console.error('Błąd podczas usuwania samochodu:', error);
              alert('Wystąpił błąd podczas usuwania samochodu.');
            }
          );
        }
    }

    

}
