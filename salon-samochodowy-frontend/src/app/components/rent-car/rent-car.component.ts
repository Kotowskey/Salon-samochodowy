import { ChangeDetectionStrategy, Component, OnDestroy, Input, inject } from '@angular/core';
import { Car, CarRenter, CarService } from '../../services/car.service';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { RentalService } from '../../services/rental.service.service';
/**
 * RentCarComponent umożliwia użytkownikom wypożyczanie oraz zwracanie samochodów.
 *
 * @component
 */
@Component({
  selector: 'app-rent-car',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rent-car.component.html',
  styleUrls: ['./rent-car.component.css']
})
export class RentCarComponent implements OnDestroy {
  
  /**
   * Obiekt reprezentujący samochód do wypożyczenia.
   * @type {Car}
   */
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
    isAvailableForRent: true
  };

  /**
   * Obiekt reprezentujący wypożyczającego samochód.
   * @type {CarRenter}
   */
  renter: CarRenter = {
    carId: 0,
    renterId: 0
  };

  /**
   * Flaga określająca, czy aktualnie zalogowany użytkownik jest wypożyczającym ten samochód.
   * @type {Observable<boolean>}
   */
  isRenter$: Observable<boolean>;

  /**
   * Subject używany do zarządzania subskrypcjami i zapobiegania wyciekom pamięci.
   * @type {Subject<void>}
   */
  private destroy$ = new Subject<void>();

  /**
   * Serwis do zarządzania danymi samochodów.
   */
  private carService = inject(CarService);

  /**
   * Serwis uwierzytelniania.
   */
  private authService = inject(AuthenticationService);

  /**
   * Serwis wynajmów.
   */
  private rentalService = inject(RentalService);
  private todayDate = new Date();
  private futureDate = new Date();
  /**
   * Konstruktor komponentu.
   * Inicjalizuje obserwację, czy aktualny użytkownik jest wypożyczającym samochód.
   */
  constructor() {
    this.isRenter$ = combineLatest([
      this.authService.currentUser$,
      this.carService.getRenterId(this.car.id)
    ]).pipe(
      map(([user, renter]) => user?.id === renter.renterId)
    );
  }

  /**
   * Metoda wypożyczająca samochód.
   * Wysyła żądanie wypożyczenia samochodu do serwisu CarService i obsługuje odpowiedzi oraz błędy.
   */
  rentCar(): void {
    this.futureDate.setDate(this.todayDate.getDate() + 14);

    this.carService.rentCar(this.car.id).pipe(takeUntil(this.destroy$)).subscribe(
      (carId: number) => {
        console.log('Wypożyczono samochód o id:', carId);
        alert('Samochód został wypożyczony');
        this.car.isAvailableForRent = false;
        this.addrental();
      },
      (error: any) => {
        console.error('Błąd przy wypożyczaniu samochodu:', error);
        alert('Wystąpił błąd przy wypożyczaniu samochodu.');
      }
    );
  }

  /**
   * Metoda zwracająca samochód.
   * Wysyła żądanie zwrotu samochodu do serwisu CarService i obsługuje odpowiedzi oraz błędy.
   */
  returnCar(): void {
    this.carService.returnCar(this.car.id).pipe(takeUntil(this.destroy$)).subscribe(
      (carId: number) => {
        console.log('Zwrócono samochód o id:', carId);
        alert('Samochód został zwrócony');
        this.car.isAvailableForRent = true;
        this.removerental();
      },
      (error: any) => {
        console.error('Błąd przy zwracaniu samochodu:', error);
        alert('Wystąpił błąd przy zwracaniu samochodu.');
      }
    );
  }
  addrental()
  {
    this.rentalService.addRental(this.car.id, this.todayDate,this.futureDate).subscribe(
      () => {
        alert('Samochód został wypożyczony i dodany bo bazy wypożyczeń');
        
      },
      (error) => {
        console.error('Błąd przy wypożyczaniu samochodu i dodawaniu do bazy:', error);
        alert('Wystąpił błąd przy wypożyczaniu samochodu i dodawaniu do bazy.');
      }
      
    );
  }
  removerental()
  {
    this.rentalService.removeRental(this.car.id).subscribe(
      () => {
        alert('Samochód został zwrócony i usunięty z bazy');
       
      },
      (error) => {
        console.error('Błąd przy zwracaniu samochodu i usuwaniu z bazy:', error);
        alert('Wystąpił błąd przy zwracaniu samochodu i usuwaniu z bazy.');
      }
    );
  }

  /**
   * Metoda czyszcząca subskrypcje przy niszczeniu komponentu, aby zapobiec wyciekom pamięci.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
