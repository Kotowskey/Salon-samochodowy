import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';

import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf],
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.css']
})
export class LoginRegisterComponent {
  isLoginMode: boolean = true;
  username: string = '';
  password: string = '';
  firstName: string = '';
  lastName: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthenticationService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit() {
    if (this.isLoginMode) {
      this.authService.login(this.username, this.password).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.closeModal();
          window.location.reload(); // Odświeżanie strony po logowaniu
        },
        error: (error) => {
          this.errorMessage = error.error.error || 'Błąd logowania';
        }
      });
    } else {
      this.authService.register(this.username, this.password, this.firstName, this.lastName).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.closeModal();
          window.location.reload(); // Odświeżanie strony po rejestracji
        },
        error: (error) => {
          this.errorMessage = error.error.error || 'Błąd rejestracji';
        }
      });
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        window.location.reload(); // Odświeżanie strony po wylogowaniu
      },
      error: () => {
        this.errorMessage = 'Nie udało się wylogować.';
      }
    });
  }

  closeModal() {
    const modalElement = document.getElementById('authModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    // Resetowanie formularza
    this.username = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
    this.errorMessage = '';
    this.successMessage = '';
  }
}
