// src/app/components/edit-car/edit-car.component.ts

import { Component, OnDestroy, Input, inject } from '@angular/core';
import { Car, CarService } from '../../services/car.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Subscription } from 'rxjs';

/**
 * EditCarComponent umożliwia edycję informacji o wybranym samochodzie bez użycia dialogów.
 *
 * @component
 */
@Component({
  selector: 'edit-car',
  standalone: true,
  templateUrl: './edit-car.component.html',
  styleUrls: ['./edit-car.component.css']
})
export class EditCarComponent implements OnDestroy {
  
  /**
   * Obiekt reprezentujący samochód do edycji.
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
    isAvailableForRent: true,
  };

  /**
   * Flaga określająca, czy aktualnie zalogowany użytkownik jest dealerem.
   * @type {boolean}
   */
  isDealer = false;

  /**
   * Flaga określająca, czy komponent znajduje się w trybie edycji.
   * @type {boolean}
   */
  isEditing = false;

  /**
   * Subskrypcja na strumień użytkownika, umożliwiająca odsubskrybowanie w metodzie ngOnDestroy.
   * @type {Subscription}
   */
  private userSubscription: Subscription;

  /**
   * Serwis do zarządzania danymi samochodów.
   */
  private carService = inject(CarService);

  /**
   * Serwis uwierzytelniania.
   */
  private authService = inject(AuthenticationService);

  /**
   * Konstruktor komponentu.
   * Inicjalizuje subskrypcję na strumień aktualnego użytkownika.
   */
  constructor() {
    // Subskrybuj strumień currentUser$
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.isDealer = user?.isDealer ?? false; // Ustaw flagę na podstawie danych użytkownika
    });
  }

  /**
   * Metoda inicjalizująca edycję samochodu.
   * Ustawia flagę isEditing na true, aby wyświetlić formularz edycji.
   */
  startEdit(): void {
    if (!this.isDealer) {
      alert('Nie masz uprawnień do edytowania samochodów.');
      return;
    }
    this.isEditing = true;
  }

  /**
   * Metoda anulująca edycję samochodu.
   * Resetuje flagę isEditing na false i przywraca oryginalne dane samochodu.
   */
  cancelEdit(): void {
    this.isEditing = false;
    // Można tutaj przywrócić oryginalne dane, jeśli były przechowywane
  }

  /**
   * Metoda edytująca informacje o samochodzie.
   * Wysyła zaktualizowane dane do serwisu CarService.
   */
  editCar(): void {
    if (!this.isDealer) {
      alert('Nie masz uprawnień do edytowania samochodów.');
      return;
    }

    this.carService.updateCar(this.car.id, this.car).subscribe(
      (updatedCar: Car) => {
        console.log('Samochód zmodyfikowany:', updatedCar);
        alert('Samochód zmodyfikowany!');
        this.isEditing = false; // Wyjście z trybu edycji po sukcesie
      },
      (error: any) => {
        console.error('Błąd przy edytowaniu samochodu:', error);
        alert('Wystąpił błąd przy edytowaniu samochodu.');
      }
    );
  }

  /**
   * Metoda czyszcząca subskrypcje przy niszczeniu komponentu, aby zapobiec wyciekom pamięci.
   */
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
