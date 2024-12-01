import { Component, Input, TemplateRef, ViewChild, inject } from '@angular/core';
import { Car,LeasingRequest,LeasingResponse,CarService } from '../../services/car.service';
import {MatDialog} from '@angular/material/dialog';
import { AuthenticationService } from '../../services/authentication.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'calculate-leasing',
  imports: [FormsModule],
  templateUrl: './calculate-leasing.component.html',
  styleUrl: './calculate-leasing.component.css'
})
export class CalculateLeasingComponent {
  @Input() car: Car = {
    id: 0,
    owner: 0,
    brand: '',
    model: '',
    year: 0,
    vin: '',
    price: 0,
    horsePower: 0,
    isAvailableForRent: true,
  };
  lRequest: LeasingRequest = {
    downPayment: 0,
    months: 0
  }
  lResponse : LeasingResponse = {
    carId: 0,
    carBrand: '',
    carModel: '',
    totalPrice: 0,
    downPayment: 0,
    remainingAmount: '',
    months: 0,
    monthlyRate: ''
  }
  @ViewChild("Leasingdialog") Leasingdialog!: TemplateRef<any>;
  @ViewChild("LeasingSummary") LeasingSummary!: TemplateRef<any>;
  private carService = inject(CarService);
  private dialog = inject(MatDialog);
  isDealer = false;
  private authService = inject(AuthenticationService);

  constructor() {
    // Subskrybuj strumień currentUser$
    this.authService.currentUser$.subscribe((user) => {
      this.isDealer = user?.isDealer ?? false; // Ustaw flagę na podstawie danych użytkownika
    });
  }

  calculate(){  
    this.carService.leaseCar(this.car.id,this.lRequest).subscribe(
      (leasingData) =>{
        this.lResponse = leasingData;
        console.log('Leasing wyliczony:', leasingData);
        //this.closeDialog();
        const dialogRef = this.dialog.open(this.LeasingSummary, {
          width: '600px',
          data: this.lResponse,
        });
      },
      (error) => {
        console.error('Błąd przy wyliczniu leasingu:', error);
        alert('Wystąpił błąd przy wyliczaniu leasingu.');
      }
    );
  }

  openLeasingDialog(): void {
    const dialogRef = this.dialog.open(this.Leasingdialog, {
      width: '600px',
      data: this.car,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.car = result;
      }
    });
  }
  closeDialog(): void {
    this.dialog.closeAll();
  }

}
