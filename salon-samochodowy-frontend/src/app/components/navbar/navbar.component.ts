// src/app/components/navbar/navbar.component.ts

import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Dodano FormsModule dla obsługi formularzy
import { LoginRegisterComponent } from '../login-register/login-register.component';
import { CustomerListComponent } from '../customer-list/customer-list.component';
import { AddCustomerComponent } from '../add-customer/add-customer.component';
import { AuthenticationService } from '../../services/authentication.service';
import { Car, CarService } from '../../services/car.service';
import { Subscription } from 'rxjs';

/**
 * NavbarComponent zarządza paskiem nawigacyjnym aplikacji, umożliwiając logowanie, rejestrację, wylogowanie oraz dodawanie samochodów.
 *
 * @component
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Dodano FormsModule dla obsługi formularzy
    LoginRegisterComponent,
    CustomerListComponent,
    AddCustomerComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnDestroy {
  
  /**
   * Obiekt reprezentujący aktualnie zalogowanego użytkownika.
   * @type {any}
   */
  currentUser: any = null;
  
  /**
   * Subskrypcja na strumień aktualnego użytkownika, umożliwiająca odsubskrybowanie w metodzie ngOnDestroy.
   * @type {Subscription}
   */
  private userSubscription: Subscription;

  /**
   * Obiekt samochodu do dodania.
   * @type {Car}
   */
  car: Car = {
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
   * Flaga określająca, czy formularz dodawania samochodu jest widoczny.
   * @type {boolean}
   */
  isAddingCar: boolean = false;

  /**
   * Komunikat o błędzie występującym podczas dodawania samochodu.
   * @type {string}
   */
  addCarErrorMessage: string = '';

  /**
   * Konstruktor komponentu.
   *
   * @param {AuthenticationService} authService - Serwis uwierzytelniania.
   * @param {CarService} carService - Serwis zarządzania samochodami.
   */
  constructor(
    private authService: AuthenticationService,
    private carService: CarService
  ) {
    // Subskrybujemy bieżącego użytkownika
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Metoda otwierająca modal logowania/rejestracji.
   */
  openAuthModal(): void {
    const modalElement = document.getElementById('authModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  /**
   * Metoda wylogowania użytkownika z odświeżeniem strony.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        window.location.reload(); // Odświeżenie strony po wylogowaniu
      },
      error: (error) => {
        console.error('Błąd podczas wylogowywania:', error);
        alert('Nie udało się wylogować. Spróbuj ponownie.');
      },
    });
  }

  /**
   * Metoda inicjalizująca komponent.
   * Zajmuje się subskrypcją na strumień użytkownika.
   */
  // Inicjalizacja odbywa się w konstruktorze, więc metoda ngOnInit nie jest wymagana.

  /**
   * Metoda czyszcząca subskrypcje przy zniszczeniu komponentu, aby zapobiec wyciekom pamięci.
   */
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  /**
   * Metoda inicjująca tryb dodawania samochodu.
   * Ustawia flagę isAddingCar na true, aby wyświetlić formularz dodawania samochodu.
   */
  startAddCar(): void {
    if (!this.currentUser?.isDealer) {
      alert('Nie masz uprawnień do dodawania samochodów.');
      return;
    }
    this.isAddingCar = true;
    this.addCarErrorMessage = '';
    // Resetowanie obiektu samochodu przed dodaniem
    this.car = {
      id: 0,
      ownerId: this.currentUser?.id ?? 0,
      renterId: 0,
      brand: '',
      model: '',
      year: 0,
      vin: '',
      price: 0,
      horsePower: 0,
      isAvailableForRent: true,
    };
  }

  /**
   * Metoda anulująca tryb dodawania samochodu.
   * Resetuje flagę isAddingCar na false i czyści formularz.
   */
  cancelAddCar(): void {
    this.isAddingCar = false;
    this.addCarErrorMessage = '';
    // Resetowanie obiektu samochodu
    this.car = {
      id: 0,
      ownerId: this.currentUser?.id ?? 0,
      renterId: 0,
      brand: '',
      model: '',
      year: 0,
      vin: '',
      price: 0,
      horsePower: 0,
      isAvailableForRent: true,
    };
  }

  /**
   * Metoda dodająca nowy samochód za pomocą serwisu CarService.
   * Wysyła dane samochodu do serwisu i obsługuje odpowiedzi oraz błędy.
   */
  addCar(): void {
    if (!this.currentUser?.isDealer) {
      alert('Nie masz uprawnień do dodawania samochodów.');
      return;
    }

    this.carService.addCar(this.car).subscribe(
      (newCar: Car) => {
        console.log('Nowy samochód dodany:', newCar);
        alert('Samochód został dodany!');
        this.isAddingCar = false; // Wyjście z trybu dodawania po sukcesie
        // Opcjonalnie można odświeżyć listę samochodów lub wykonać inne akcje
      },
      (error: any) => {
        console.error('Błąd przy dodawaniu samochodu:', error);
        this.addCarErrorMessage = error.error.error || 'Wystąpił błąd przy dodawaniu samochodu.';
      }
    );
  }
}
