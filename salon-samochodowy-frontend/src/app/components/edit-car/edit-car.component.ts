import {Component, inject, Input} from '@angular/core';
import {Car,CarService } from '../../services/car.service';
import {MatDialog} from '@angular/material/dialog';
import { ShowCarForm } from '../show-car-form/show-car-form.component';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'edit-car',
  imports: [],
  templateUrl: './edit-car.component.html',
  styleUrl: './edit-car.component.css'
})
export class EditCarComponent {
  @Input() car: Car = {
    id: 0,
    ownerId: 0,
    renterId: 0,
    brand: '',
    model: '',
    year: 0,
    vin: '',
    price: 0,
    horsePower: 0,
    isAvailableForRent: true,
  };

  isDealer = false;
  private carService = inject(CarService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthenticationService);

  constructor() {
    // Subskrybuj strumień currentUser$
    this.authService.currentUser$.subscribe((user) => {
      this.isDealer = user?.isDealer ?? false; // Ustaw flagę na podstawie danych użytkownika
    });
  }
  editCar(){
    this.carService.updateCar(this.car.id,this.car).subscribe(
      (updatedCar) =>{
        console.log('Samochód zmodyfikowany:', updatedCar);
        alert('Samochód zmodyfikowany!');
      },
      (error) => {
        console.error('Błąd przy edytowaniu samochodu:', error);
        alert('Wystąpił błąd przy edytowaniu samochodu.');
      }
    );
  }
  openEditCarDialog(): void {
    const dialogRef = this.dialog.open(ShowCarForm, {
      width: '600px',
      data: this.car,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.car = result;
        this.editCar();
      }
    });
  }
}