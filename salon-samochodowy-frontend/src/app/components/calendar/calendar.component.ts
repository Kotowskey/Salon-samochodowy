import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { RentalService } from '../../services/rental.service.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  isOpen = false;
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  calendar: number[][] = [];
  rentalDates: Date[] = [];
  rentals: any[] = [];
  currentUserId: number | null = null; 
  private rentalDatesSubscription: Subscription | null = null;
  private rentalsSubscription: Subscription | null = null;
  private rentalService = inject(RentalService);
  private authService = inject(AuthenticationService);
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null; // Przechowaj ID zalogowanego użytkownika
    });
 
   this.rentalsSubscription = this.rentalService.rentals$.subscribe(
   (rentals) => {
     this.rentals = rentals;
     console.log('Zaktualizowane wynajmy:', this.rentals);
    }
  );

    this.rentalService.loadRentals();
    this.generateCalendar();
  }

  ngOnDestroy() {
    if (this.rentalDatesSubscription) {
      this.rentalDatesSubscription.unsubscribe();
    }
    if (this.rentalsSubscription) {
      this.rentalsSubscription.unsubscribe();
    }
  }

  open() {
    this.isOpen = true;
    this.rentalService.loadRentals();
  }

  close() {
    this.isOpen = false;
  }

  

  isUserRentExist(date: Date): boolean {
    if (!this.currentUserId) {
      console.error('Brak zalogowanego użytkownika');
      return false;
    }
  
   
    // Sprawdź, czy istnieje wynajem użytkownika, który obejmuje daną datę
    return this.rentals.some((rental: { userId: number; startDate: string; endDate: string }) => 
      rental.userId === this.currentUserId &&
      date >= new Date(rental.startDate) &&
      date <= new Date(rental.endDate)
    );
    
  }
  
  




  changeMonth(direction: number) {
    this.currentMonth += direction;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

 

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const weeks: number[][] = [];
    let week: number[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length) {
      week = [...week, ...Array(7 - week.length).fill(null)];
      weeks.push(week);
    }

    this.calendar = weeks;
  }

  toDate(date: number | null): Date {

    const today = new Date();
    today.getDate() === date;
      today.getMonth() === this.currentMonth;
      today.getFullYear() === this.currentYear;
    return today;

  }
  datetoDate(date: number | null): Date {
    if (date === null) {
      return new Date(NaN); // Zwraca nieprawidłową datę dla pustych komórek.
    }
    return new Date(this.currentYear, this.currentMonth, date);
  }
  
  isRented(date: number | null): boolean {
    if (date === null) {
      return false;
    }

    const targetDate = new Date(this.currentYear, this.currentMonth, date);
    return this.rentalDates.some(
      (rentalDate) =>
        rentalDate.getFullYear() === targetDate.getFullYear() &&
        rentalDate.getMonth() === targetDate.getMonth() &&
        rentalDate.getDate() === targetDate.getDate()
    );
  }
}
