import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es-AR';
import { AppComponent } from './app/app';
import { routes } from './app/routes';
import { Auth } from './app/core';
registerLocaleData(es);
bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideAppInitializer(() => inject(Auth).init()),
  ],
}).catch(() => console.error('No se pudo iniciar la interfaz.'));
