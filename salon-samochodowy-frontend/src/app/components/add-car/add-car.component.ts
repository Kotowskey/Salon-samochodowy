import { Component } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { FormsModule } from '@angular/forms';  // Importowanie FormsModule

@Component({
  selector: 'app-add-car',
  standalone: true,  // Ustawienie komponentu jako standalone
  imports: [FormsModule],  // Dodanie FormsModule do komponentu
  templateUrl: './add-car.component.html',
  styleUrls: ['./add-car.component.css']
})
export class AddCarComponent {
  car: Car = {
    id: 0,
    brand: '',
    model: '',
    year: 0,
    vin: '',
    price: 0,
    isAvailableForRent: true
  };

  constructor(private carService: CarService) {}

  addCar() {
    this.carService.addCar(this.car).subscribe(
      (newCar) => {
        console.log('Nowy samochód dodany:', newCar);
        alert('Samochód został dodany!');
      },
      (error) => {
        console.error('Błąd przy dodawaniu samochodu:', error);
        alert('Wystąpił błąd przy dodawaniu samochodu.');
      }
    );
  }
}
