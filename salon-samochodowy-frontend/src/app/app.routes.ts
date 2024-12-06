import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'cars',
    pathMatch: 'full',
  },
  {
    path: 'cars',
    loadComponent: () =>
      import('./components/car-list/car-list.component').then((m) => m.CarListComponent),
  },
  {
    path: 'cars/:id',
    loadComponent: () =>
      import('./components/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
  },
];
