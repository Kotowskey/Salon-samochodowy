import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CarService, Car } from '../../services/car.service';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="car">
      <h2>{{ car.brand }} {{ car.model }}</h2>
      <p><strong>Rok:</strong> {{ car.year }}</p>
      <p><strong>Moc:</strong> {{ car.horsePower }} KM</p>
      <p><strong>VIN:</strong> {{ car.vin }}</p>
      <p><strong>Cena:</strong> {{ car.price | currency: 'PLN' }}</p>
      <p>
        <strong>Dostępny do wynajmu:</strong>
        <span [ngClass]="car.isAvailableForRent ? 'text-success' : 'text-danger'">
          {{ car.isAvailableForRent ? 'Tak' : 'Nie' }}
        </span>
      </p>
    </div>
  `,
  styleUrls: ['./car-detail.component.css'],
})
export class CarDetailComponent implements OnInit {
  car?: Car;

  constructor(private route: ActivatedRoute, private carService: CarService) {}

  ngOnInit(): void {
    const carId = this.route.snapshot.params['id'];
    this.carService.getCar(+carId).subscribe((car) => {
      this.car = car;
    });
  }
}
