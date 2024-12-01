import {ChangeDetectionStrategy, Component, inject,Input }from '@angular/core';
import {Car,CarRenter,CarService } from '../../services/car.service';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable, of } from 'rxjs'; // Observable i of (tworzenie strumieni)
import { map, switchMap } from 'rxjs/operators'; // Operatory map i switchMap

@Component({
  selector: 'app-rent-car',
  standalone: true,  
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,  
  templateUrl: './rent-car.component.html',
  styleUrls: ['./rent-car.component.css']
})
export class RentCarComponent {
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
  renter: CarRenter = {
    carId: 0,
    renterId: 0
  }

  private carService = inject(CarService);
  private authService = inject(AuthenticationService);
  isRenter = false;
  rentCar() {
    this.carService.rentCar(this.car.id).subscribe(
      (carId) => {
        console.log('Wypożyczono samochód o id:', carId);
        alert('Samochód został wypożyczony');
      },
      (error) => {
        console.error('Błąd przy wypożyczaniu samochodu:', error);
        alert('Wystąpił błąd przy wypożyczaniu samochodu.');
      }
    );
  }
  returnCar() 
  {
    this.carService.returnCar(this.car.id).subscribe(
      (carId) => {
        console.log('Zwrócono samochód o id:', carId);
        alert('Samochód został zwrócony');
      },
      (error) => {
        console.error('Błąd przy zwracaniu samochodu:', error);
        alert('Wystąpił błąd przy zwracaniu samochodu.');
      }
    );
  }
  isYouRented():boolean
  {

  this.carService.getRenterId(this.car.id).subscribe( data =>
  {
    this.renter = data;
  });


  if(this.renter.renterId == null) this.isRenter = false;


  this.authService.currentUser$.subscribe((user) => {
      if(user?.id == this.renter.renterId) this.isRenter = true;
      else this.isRenter;
    });
    return this.isRenter;
  }
  
}
