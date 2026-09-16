import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'propiedades',
    loadComponent: () =>
      import('./features/properties/property-list/property-list.component').then(
        (m) => m.PropertyListComponent,
      ),
  },
  {
    path: 'propiedades/:id',
    loadComponent: () =>
      import('./features/properties/property-detail/property-detail.component').then(
        (m) => m.PropertyDetailComponent,
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/olvide-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'auth/restablecer-contrasena',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'mis-reservas',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () =>
      import('./features/bookings/my-bookings/my-bookings.component').then(
        (m) => m.MyBookingsComponent,
      ),
  },
  {
    path: 'reservas/pago-resultado',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/bookings/payment-result/payment-result.component').then(
        (m) => m.PaymentResultComponent,
      ),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMINISTRADOR')],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'propiedades', pathMatch: 'full' },
      {
        path: 'propiedades',
        loadComponent: () =>
          import(
            './features/admin/properties/property-list-admin/property-list-admin.component'
          ).then((m) => m.PropertyListAdminComponent),
      },
      {
        path: 'propiedades/nueva',
        loadComponent: () =>
          import('./features/admin/properties/property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'propiedades/:id',
        loadComponent: () =>
          import('./features/admin/properties/property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('./features/admin/reservations/admin-reservations.component').then(
            (m) => m.AdminReservationsComponent,
          ),
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/admin/payments/admin-payments.component').then(
            (m) => m.AdminPaymentsComponent,
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reports/admin-reports.component').then(
            (m) => m.AdminReportsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
