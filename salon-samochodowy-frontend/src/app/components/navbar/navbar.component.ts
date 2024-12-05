// src/app/navbar/navbar.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRegisterComponent } from '../login-register/login-register.component';
import { AuthenticationService } from '../../services/authentication.service';
import { Subscription } from 'rxjs';

// Importujemy potrzebne moduły i komponenty
import { CustomerListComponent } from '../customer-list/customer-list.component';
import { AddCustomerComponent } from '../add-customer/add-customer.component';
import { MatDialog } from '@angular/material/dialog';
import { Car, CarService } from '../../services/car.service';
import { ShowCarForm } from '../show-car-form/show-car-form.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    LoginRegisterComponent,
    CustomerListComponent,
    AddCustomerComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnDestroy {
  currentUser: any = null;
  private userSubscription: Subscription;

  // Definiujemy obiekt samochodu
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

  constructor(
    private authService: AuthenticationService,
    private dialog: MatDialog,
    private carService: CarService
  ) {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  openAuthModal() {
    const modalElement = document.getElementById('authModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Dodatkowe akcje po wylogowaniu (opcjonalnie)
      },
      error: (error) => {
        console.error('Błąd podczas wylogowywania:', error);
      },
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  // Metody związane z dodawaniem samochodu
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.car = result;
        this.addCar();
      }
    });
  }
}
