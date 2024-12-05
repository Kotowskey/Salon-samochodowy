// src/app/navbar/navbar.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRegisterComponent } from '../login-register/login-register.component';
import { AuthenticationService } from '../../services/authentication.service';
import { Subscription } from 'rxjs';

// Importuj nowe komponenty
import { CustomerListComponent } from '../customer-list/customer-list.component';
import { AddCustomerComponent } from '../add-customer/add-customer.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LoginRegisterComponent, CustomerListComponent, AddCustomerComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnDestroy {
  currentUser: any = null;
  private userSubscription: Subscription;

  constructor(private authService: AuthenticationService) {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
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
        // Możesz dodać dodatkowe akcje po wylogowaniu
      },
      error: (error) => {
        console.error('Błąd podczas wylogowywania:', error);
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }
}
