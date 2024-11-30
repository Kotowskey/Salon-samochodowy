// src/app/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginRegisterComponent } from '../login-register/login-register.component';
import { AuthenticationService } from '../../services/authentication.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LoginRegisterComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
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
