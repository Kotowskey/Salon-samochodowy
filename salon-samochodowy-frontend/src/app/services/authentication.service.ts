import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isDealer: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private apiUrl = 'http://localhost:3000'; // Zaktualizuj URL backendu
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkCurrentUser();
  }

  private checkCurrentUser() {
    this.http.get<{ user: User }>(`${this.apiUrl}/current-user`, { withCredentials: true })
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response.user);
        }),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        })
      )
      .subscribe();
  }

  register(username: string, password: string, firstName: string, lastName: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/register`,
      { username, password, firstName, lastName },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
      })
    );
  }
}
