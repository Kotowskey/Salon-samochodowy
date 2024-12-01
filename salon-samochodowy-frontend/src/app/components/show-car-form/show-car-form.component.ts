import {Component, Inject, Input} from '@angular/core';
import {Car} from '../../services/car.service';
import {FormsModule} from '@angular/forms';
import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
@Component({
  selector: 'show-car-form',
  standalone: true,  
  imports: [FormsModule],  
  templateUrl: './show-car-form.component.html',
  styleUrls: ['./show-car-form.component.css']
})
export class ShowCarForm {
  @Input() car: Car = {
    id: 0,
    owner: 0,
    brand: '',
    model: '',
    year: 0,
    vin: '',
    price: 0,
    horsePower: 0,
    isAvailableForRent: true
  };

  constructor(
    private dialogRef: MatDialogRef<ShowCarForm>,
    @Inject(MAT_DIALOG_DATA) data: Car // Odbiór przekazanych danych
  ) {
    // Przypisanie przekazanych danych do istniejącej zmiennej `car`
    Object.assign(this.car, data);
  }

  addCar() {
    this.dialogRef.close(this.car);
  }
  closeDialog(): void {
    this.dialogRef.close();
  }
}
