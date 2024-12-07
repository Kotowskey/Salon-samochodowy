// src/app/components/car-list/car-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EditCarComponent } from '../edit-car/edit-car.component';
import { AuthenticationService } from '../../services/authentication.service';
import { RentCarComponent } from '../rent-car/rent-car.component';
import { CalculateLeasingComponent } from '../calculate-leasing/calculate-leasing.component';
import { BuyCarComponent } from '../buy-car/buy-car.component';
import { combineLatest, Subscription } from 'rxjs';

/**
 * CarListComponent zarządza listą samochodów, umożliwiając ich przeglądanie, sortowanie, filtrowanie oraz operacje takie jak edycja, wynajem, leasing czy zakup.
 *
 * @component
 */
@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditCarComponent,
    RentCarComponent,
    CalculateLeasingComponent,
    BuyCarComponent,
    RouterModule
  ],
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.css']
})
export class CarListComponent implements OnInit, OnDestroy {
  
  /**
   * Flaga określająca, czy aktualnie zalogowany użytkownik jest dealerem.
   * @type {boolean}
   */
  isDealer = false;

  /**
   * Flaga określająca, czy użytkownik jest zalogowany.
   * @type {boolean}
   */
  logged = false;

  /**
   * Identyfikator aktualnie zalogowanego użytkownika.
   * @type {number}
   */
  userId = -1;

  /**
   * Wartość wpisana w polu wyszukiwania marki samochodu.
   * @type {string}
   */
  brandSearch = "";

  /**
   * Lista wszystkich dostępnych samochodów.
   * @type {Car[]}
   */
  cars: Car[] = [];

  /**
   * Lista samochodów należących do aktualnie zalogowanego użytkownika.
   * @type {Car[]}
   */
  ownedCars: Car[] = [];

  /**
   * Lista samochodów po zastosowaniu sortowania.
   * @type {Car[]}
   */
  sortedCars: Car[] = [];

  /**
   * Lista samochodów po zastosowaniu filtrowania.
   * @type {Car[]}
   */
  filteredCars: Car[] = [];

  /**
   * Kierunek sortowania według ceny.
   * @type {'asc' | 'desc'}
   */
  priceSortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Kierunek sortowania według mocy silnika.
   * @type {'asc' | 'desc'}
   */
  horsePowerSortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Subskrypcja na połączone strumienie użytkownika i samochodów.
   * @type {Subscription}
   */
  private combinedSubscription?: Subscription;

  /**
   * Konstruktor komponentu.
   *
   * @param {CarService} carService - Serwis do zarządzania danymi samochodów.
   * @param {AuthenticationService} authService - Serwis uwierzytelniania.
   */
  constructor(
    private carService: CarService,
    private authService: AuthenticationService
  ) { }

  /**
   * Metoda inicjalizacyjna wywoływana po utworzeniu komponentu.
   * Subskrybuje strumienie użytkownika i listy samochodów, aktualizując odpowiednie właściwości komponentu.
   */
  ngOnInit(): void {
    // Połączenie strumieni użytkownika i samochodów
    this.combinedSubscription = combineLatest([
      this.authService.currentUser$,
      this.carService.getCars()
    ]).subscribe(([user, cars]) => {
      this.isDealer = user?.isDealer ?? false;
      this.logged = !!user;
      this.userId = user?.id ?? -1;
      this.cars = cars;

      // Aktualizacja ownedCars
      if (this.logged) {
        this.ownedCars = this.cars.filter(car => car.ownerId === this.userId);
      } else {
        this.ownedCars = [];
      }

      // Filtracja samochodów dostępnych do wynajmu (zakładając, że ownerId = null oznacza dostępność)
      this.sortedCars = this.cars.filter(car => car.ownerId == null);
      this.filterCars();
    });
  }

  /**
   * Metoda sortująca samochody według ceny.
   * Zmienia kierunek sortowania przy każdym wywołaniu.
   */
  sortByPrice(): void {
    if (this.priceSortDirection === 'asc') {
      this.sortedCars.sort((a, b) => a.price - b.price);
      this.priceSortDirection = 'desc';
    } else {
      this.sortedCars.sort((a, b) => b.price - a.price);
      this.priceSortDirection = 'asc';
    }
    // Resetowanie sortowania mocy, jeśli jest aktywne
    this.horsePowerSortDirection = 'asc';
    this.filterCars(); // Aktualizacja listy po sortowaniu
  }

  /**
   * Metoda sortująca samochody według mocy silnika.
   * Zmienia kierunek sortowania przy każdym wywołaniu.
   */
  sortByHorsePower(): void {
    if (this.horsePowerSortDirection === 'asc') {
      this.sortedCars.sort((a, b) => a.horsePower - b.horsePower);
      this.horsePowerSortDirection = 'desc';
    } else {
      this.sortedCars.sort((a, b) => b.horsePower - a.horsePower);
      this.horsePowerSortDirection = 'asc';
    }
    // Resetowanie sortowania ceny, jeśli jest aktywne
    this.priceSortDirection = 'asc';
    this.filterCars(); // Aktualizacja listy po sortowaniu
  }

  /**
   * Metoda usuwająca samochód o podanym identyfikatorze.
   * Sprawdza uprawnienia użytkownika przed wykonaniem operacji.
   *
   * @param {number} id - Unikalny identyfikator samochodu do usunięcia.
   */
  deleteCar(id: number): void {
    if (!this.isDealer) {
      alert('Nie masz uprawnień do usuwania samochodów.');
      return;
    }

    if (confirm('Czy na pewno chcesz usunąć ten samochód?')) {
      this.carService.deleteCar(id).subscribe(
        () => {
          this.cars = this.cars.filter((car) => car.id !== id);
          this.sortedCars = this.sortedCars.filter((car) => car.id !== id);
          this.ownedCars = this.ownedCars.filter((car) => car.id !== id);
          this.filterCars(); // Aktualizacja po usunięciu samochodu
          alert('Samochód został usunięty.');
        },
        (error) => {
          console.error('Błąd podczas usuwania samochodu:', error);
          alert('Wystąpił błąd podczas usuwania samochodu.');
        }
      );
    }
  }

  /**
   * Metoda wywoływana przy każdej zmianie w polu wyszukiwania marki samochodu.
   * Inicjuje filtrowanie listy samochodów.
   */
  onBrandSearchChange(): void {
    this.filterCars(); // Filtracja samochodów przy każdej zmianie w polu wyszukiwania
  }

  /**
   * Metoda filtrująca samochody na podstawie wpisanej marki.
   * Aktualizuje listę `filteredCars` zgodnie z kryteriami filtrowania.
   */
  filterCars(): void {
    this.filteredCars = this.sortedCars.filter(car =>
      car.brand.toLowerCase().includes(this.brandSearch.toLowerCase())
    );
  }

  /**
   * Metoda czyszcząca subskrypcje przy niszczeniu komponentu, aby zapobiec wyciekom pamięci.
   */
  ngOnDestroy(): void {
    this.combinedSubscription?.unsubscribe();
  }
}
