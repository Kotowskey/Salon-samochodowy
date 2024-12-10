import { Component, Inject, Input } from '@angular/core';
import { Car } from '../../services/car.service';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * @module ShowCarForm
 * @description
 * Komponent odpowiedzialny za wyświetlanie formularza samochodu w oknie dialogowym. Umożliwia dodawanie nowych samochodów poprzez wypełnienie formularza.
 *
 * ## Przykład użycia
 * ```typescript
 * import { MatDialog } from '@angular/material/dialog';
 * import { ShowCarForm } from './show-car-form/show-car-form.component';
 *
 * // ...
 *
 * constructor(private dialog: MatDialog) {}
 *
 * openShowCarForm() {
 *   const dialogRef = this.dialog.open(ShowCarForm, {
 *     width: '600px',
 *     data: { ...carData },
 *   });
 *
 *   dialogRef.afterClosed().subscribe(result => {
 *     if (result) {
 *       // Obsłuż dodanie samochodu
 *     }
 *   });
 * }
 * ```
 */
@Component({
  selector: 'show-car-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './show-car-form.component.html',
  styleUrls: ['./show-car-form.component.css'],
})
export class ShowCarForm {
  
  /**
   * @input
   * @type {Car}
   * @description
   * Obiekt reprezentujący samochód do wyświetlenia lub edycji w formularzu. Zawiera wszystkie niezbędne informacje o samochodzie.
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
   * @constructor
   * @param {MatDialogRef<ShowCarForm>} dialogRef - Referencja do okna dialogowego, umożliwiająca kontrolę nad jego stanem.
   * @param {Car} data - Dane samochodu przekazane do komponentu przez okno dialogowe.
   * @description
   * Inicjalizuje komponent, przypisując przekazane dane do właściwości `car`.
   */
  constructor(
    private dialogRef: MatDialogRef<ShowCarForm>,
    @Inject(MAT_DIALOG_DATA) data: Car
  ) {
    Object.assign(this.car, data);
  }

  /**
   * @method
   * @name addCar
   * @description
   * Zamyka okno dialogowe i przekazuje zaktualizowany obiekt `car` do komponentu otwierającego dialog. Umożliwia to dodanie nowego samochodu lub aktualizację istniejącego.
   *
   * @example
   * ```typescript
   * this.addCar();
   * ```
   */
  addCar() {
    this.dialogRef.close(this.car);
  }

  /**
   * @method
   * @name closeDialog
   * @description
   * Zamyka okno dialogowe bez przekazywania żadnych danych. Używane, gdy użytkownik zdecyduje się anulować operację.
   *
   * @example
   * ```typescript
   * this.closeDialog();
   * ```
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
