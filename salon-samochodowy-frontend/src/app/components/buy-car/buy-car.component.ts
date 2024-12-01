// src/app/components/buy-car/buy-car.component.ts
import { Component, Input } from '@angular/core';
import { CarService, Car } from '../../services/car.service';

@Component({
  selector: 'app-buy-car',
  standalone: true,
  templateUrl: './buy-car.component.html',
  styleUrls: ['./buy-car.component.css']
})
export class BuyCarComponent {
  @Input() car!: Car;

  constructor(private carService: CarService) {}

  buyCar(): void {
    if (!this.car) {
      alert('Samochód nie został wybrany.');
      return;
    }

    if (!confirm(`Czy na pewno chcesz kupić samochód ${this.car.brand} ${this.car.model}?`)) {
      return;
    }

    this.carService.buyCar(this.car.id).subscribe({
      next: () => {
        alert(`Zakup samochodu ${this.car.brand} ${this.car.model} zakończony sukcesem!`);
      },
      error: (err) => {
        console.error('Błąd zakupu samochodu:', err);
        alert('Wystąpił błąd podczas zakupu samochodu.');
      }
    });
  }
}
