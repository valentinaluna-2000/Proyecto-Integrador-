import { Routes } from '@angular/router';
import { authenticated, adminGuard } from './core';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home').then((m) => m.HomeComponent) },
  { path: 'propiedades', loadComponent: () => import('./catalog').then((m) => m.CatalogComponent) },
  {
    path: 'propiedades/:id',
    loadComponent: () => import('./catalog').then((m) => m.DetailComponent),
  },
  ...[
    ['login', 'login'],
    ['registro', 'registro'],
    ['revisa-tu-correo', 'revisa'],
    ['verificado', 'verificado'],
    ['recuperar', 'recuperar'],
    ['reenviar', 'reenviar'],
    ['restablecer-contrasena', 'restablecer'],
  ].map(([path, mode]) => ({
    path: `auth/${path}`,
    data: { mode },
    loadComponent: () => import('./auth-pages').then((m) => m.AuthPageComponent),
  })),
  {
    path: 'cuenta',
    canActivate: [authenticated],
    loadComponent: () => import('./account').then((m) => m.ProfileComponent),
  },
  {
    path: 'cuenta/contrasena',
    canActivate: [authenticated],
    data: { mode: 'cambiar' },
    loadComponent: () => import('./auth-pages').then((m) => m.AuthPageComponent),
  },
  {
    path: 'mis-reservas',
    canActivate: [authenticated],
    loadComponent: () => import('./account').then((m) => m.ReservationsComponent),
  },
  {
    path: 'mis-reservas/:id',
    canActivate: [authenticated],
    loadComponent: () => import('./account').then((m) => m.ReservationDetailComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    data: { dashboard: true },
    loadComponent: () => import('./admin').then((m) => m.ReportsComponent),
  },
  {
    path: 'admin/propiedades',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin').then((m) => m.AdminPropertiesComponent),
  },
  {
    path: 'admin/propiedades/nueva',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin').then((m) => m.PropertyEditorComponent),
  },
  {
    path: 'admin/propiedades/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin').then((m) => m.PropertyEditorComponent),
  },
  {
    path: 'admin/reservas',
    canActivate: [adminGuard],
    loadComponent: () => import('./account').then((m) => m.ReservationsComponent),
  },
  {
    path: 'admin/reservas/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./account').then((m) => m.ReservationDetailComponent),
  },
  {
    path: 'admin/pagos',
    canActivate: [adminGuard],
    data: { payments: true },
    loadComponent: () => import('./admin').then((m) => m.TransactionsComponent),
  },
  {
    path: 'admin/cancelaciones',
    canActivate: [adminGuard],
    data: { payments: false },
    loadComponent: () => import('./admin').then((m) => m.TransactionsComponent),
  },
  {
    path: 'admin/reportes',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin').then((m) => m.ReportsComponent),
  },
  { path: '**', redirectTo: '' },
];
