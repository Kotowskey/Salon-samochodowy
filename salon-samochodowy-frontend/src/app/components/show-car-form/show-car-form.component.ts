// src/app/show-car-form/show-car-form.component.ts

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Car } from '../../services/car.service';
import { FormsModule } from '@angular/forms';

/**
 * ShowCarFormComponent umożliwia wyświetlanie i edycję informacji o samochodzie.
 * Jest używany jako standardowy komponent bez wykorzystania dialogów.
 *
 * @component
 */
@Component({
  selector: 'show-car-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './show-car-form.component.html',
  styleUrls: ['./show-car-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Opcjonalnie dla lepszej wydajności
})
export class ShowCarFormComponent {
  
  /**
   * Obiekt reprezentujący samochód do wyświetlenia i edycji.
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
   * Emituje zdarzenie dodania samochodu po zapisaniu zmian.
   * @type {EventEmitter<Car>}
   */
  @Output() addCarEvent: EventEmitter<Car> = new EventEmitter<Car>();

  /**
   * Emituje zdarzenie zamknięcia formularza bez zapisania zmian.
   * @type {EventEmitter<void>}
   */
  @Output() closeEvent: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Konstruktor komponentu.
   */
  constructor() { }

  /**
   * Metoda emitująca zdarzenie dodania samochodu z aktualizowanymi danymi.
   */
  addCar(): void {
    this.addCarEvent.emit(this.car);
  }

  /**
   * Metoda emitująca zdarzenie zamknięcia formularza.
   */
  closeDialog(): void {
    this.closeEvent.emit();
  }
}
