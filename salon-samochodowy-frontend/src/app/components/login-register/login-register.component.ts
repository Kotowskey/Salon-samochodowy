// src/app/login-register/login-register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';

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

  constructor(private authService: AuthenticationService) {}

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
        },
        error: (error) => {
          this.errorMessage = error.error.error || 'Błąd rejestracji';
        }
      });
    }
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
