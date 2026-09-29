# Frontend Angular

`frontend/src/main.ts` arranca Angular. `frontend/src/app/routes.ts` carga componentes standalone: `/` usa `HomeComponent`, `/propiedades` `CatalogComponent`, `/propiedades/:id` `DetailComponent`, y las rutas protegidas usan `authenticated` o `adminGuard` de `core.ts`.

`Api` en `frontend/src/app/core.ts` es el único cliente HTTP propio: construye `/api`, agrega el Bearer token obtenido de Supabase y traduce errores. No hay interceptor Angular registrado; esa responsabilidad está explícitamente dentro de `Api.request`. `Auth` conserva el perfil en una signal, inicializa Supabase, escucha cambios de sesión y consulta `/auth/me` para convertir identidad externa en perfil Rentify.

## Pantallas y cambios manuales

| Objetivo | Archivo |
|---|---|
| Inicio, buscador y destacados | `frontend/src/app/home.ts` |
| Catálogo y filtros | `frontend/src/app/catalog.ts` (`CatalogComponent`) |
| Detalle y reserva | `frontend/src/app/catalog.ts` (`DetailComponent`) |
| Calendario | `calendar.ts` y `calendar-domain.ts` |
| Login, registro, recovery | `auth-pages.ts` |
| Perfil y reservas cliente | `account.ts` |
| Administración | `admin.ts` |
| Navbar/footer | `app.ts` |
| Logo | `public/branding/rentify-logo.png` |
| Paleta/theme | `src/styles.css` |

Los formularios usan `FormsModule` y `[(ngModel)]`. El calendario recibe `propertyId`, límite, ingreso y egreso; emite `selected` al detalle. Sus reglas puras son testeables sin navegador. Cambiá color mediante `--rentify-primary`, `--rentify-secondary`, `--rentify-accent` y `--rentify-background`, no agregando colores dispersos.
