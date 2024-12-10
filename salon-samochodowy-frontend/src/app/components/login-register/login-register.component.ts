import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * LoginRegisterComponent umożliwia użytkownikom logowanie oraz rejestrację w aplikacji.
 *
 * @component
 */
@Component({
  selector: 'app-login-register',
  standalone: true, // Dodaj standalone: true
  imports: [CommonModule, FormsModule], // Dodaj imports
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.css']
})
export class LoginRegisterComponent implements OnDestroy {
  
  /**
   * Flaga określająca, czy komponent jest w trybie logowania.
   * Jeśli ustawiona na `true`, formularz umożliwia logowanie. Jeśli na `false`, rejestrację.
   * @type {boolean}
   */
  isLoginMode: boolean = true;
  
  /**
   * Nazwa użytkownika wpisana w formularzu.
   * @type {string}
   */
  username: string = '';
  
  /**
   * Hasło użytkownika wpisane w formularzu.
   * @type {string}
   */
  password: string = '';
  
  /**
   * Imię użytkownika wpisane podczas rejestracji.
   * @type {string}
   */
  firstName: string = '';
  
  /**
   * Nazwisko użytkownika wpisane podczas rejestracji.
   * @type {string}
   */
  lastName: string = '';
  
  /**
   * Komunikat o błędzie występującym podczas logowania lub rejestracji.
   * @type {string}
   */
  errorMessage: string = '';
  
  /**
   * Komunikat o sukcesie podczas logowania lub rejestracji.
   * @type {string}
   */
  successMessage: string = '';
  
  /**
   * Subject używany do zarządzania subskrypcjami i zapobiegania wyciekom pamięci.
   * @type {Subject<void>}
   */
  private destroy$: Subject<void> = new Subject<void>();

  /**
   * Konstruktor komponentu.
   *
   * @param {AuthenticationService} authService - Serwis do uwierzytelniania użytkowników.
   * @param {Router} router - Serwis do nawigacji między trasami.
   */
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  /**
   * Metoda inicjalizująca komponent.
   * Nie jest wymagana implementacja OnInit, ponieważ logika inicjalizacji jest prosta.
   */
  // ngOnInit nie jest potrzebne, ponieważ inicjalizacja odbywa się w konstruktorze i metodach.

  /**
   * Metoda przełączająca tryb między logowaniem a rejestracją.
   * Resetuje komunikaty o błędach i sukcesie przy każdej zmianie trybu.
   */
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Metoda obsługująca przesłanie formularza logowania lub rejestracji.
   * W zależności od trybu, wywołuje odpowiednie metody serwisu AuthenticationService.
   */
  onSubmit(): void {
    if (this.isLoginMode) {
      this.authService.login(this.username, this.password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.closeModal();
            // Przekierowanie po zalogowaniu
            this.router.navigate(['/']);
          },
          error: (error) => {
            this.errorMessage = error.error.error || 'Błąd logowania';
          }
        });
    } else {
      this.authService.register(this.username, this.password, this.firstName, this.lastName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.closeModal();
            // Opcjonalne automatyczne logowanie po rejestracji
            this.authService.login(this.username, this.password)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.router.navigate(['/']);
                },
                error: (error) => {
                  this.errorMessage = error.error.error || 'Błąd logowania po rejestracji';
                }
              });
          },
          error: (error) => {
            this.errorMessage = error.error.error || 'Błąd rejestracji';
          }
        });
    }
  }

  /**
   * Metoda wylogowująca aktualnie zalogowanego użytkownika.
   * Po wylogowaniu, przekierowuje użytkownika na stronę główną.
   */
  logout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Aktualizacja stanu aplikacji po wylogowaniu
          this.router.navigate(['/']);
        },
        error: () => {
          this.errorMessage = 'Nie udało się wylogować.';
        }
      });
  }

  /**
   * Metoda zamykająca modal z formularzem logowania lub rejestracji.
   * Resetuje wszystkie pola formularza oraz komunikaty o błędach i sukcesie.
   */
  closeModal(): void {
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

  /**
   * Metoda czyszcząca subskrypcje przy niszczeniu komponentu, aby zapobiec wyciekom pamięci.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
