// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Klonowanie żądania i dodanie withCredentials: true
    const clonedRequest = req.clone({
      withCredentials: true
    });

    // Kontynuowanie przetwarzania żądania
    return next.handle(clonedRequest);
  }
}
