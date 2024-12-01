import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Car,CarService } from '../../services/car.service';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { ShowCarForm } from '../show-car-form/show-car-form.component';

@Component({
  selector: 'app-add-car',
  standalone: true,  
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,  
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
    horsePower: 0,
    isAvailableForRent: true
  };
  private dialog = inject(MatDialog);
  private carService = inject(CarService);

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
  openAddCarDialog(): void {
    const dialogRef = this.dialog.open(ShowCarForm, {
      width: '600px',
      data: { ...this.car },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.car = result;
        this.addCar();
      }
    });
  }
}
