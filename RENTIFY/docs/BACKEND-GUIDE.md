# Backend NestJS

El punto de entrada es `backend/src/main.ts`: crea `AppModule`, aplica Helmet, CORS, `validationPipe`, `ErrorFilter` y Swagger en `/docs`. `backend/src/app.module.ts` agrupa módulos de usuarios, propiedades, disponibilidad, reservas, pagos, reportes y jobs.

## Recorrido HTTP

`GET /properties/:id/availability` entra a `PropertiesController.available` en `backend/src/properties/properties.controller.ts`; `RangeDto` de `backend/src/common/dtos.ts` es validado; `AvailabilityService.check` consulta TypeORM/SQL parametrizado; Nest serializa la respuesta. Este reparto separa transporte (controller), validación (DTO), negocio (service) y persistencia (repository/DataSource).

Los listados de propiedades (`GET /properties`, `GET /admin/properties`) y reservas (`GET /reservations/me`, `GET /admin/reservations`) aceptan `page` (desde 1) y `limit` (1–100). La respuesta tiene `{ items, total, page, limit }`; el catálogo y las propiedades administrativas muestran 12 elementos por página, y las reservas muestran 20. `GET /admin/properties/options` devuelve solo id y nombre para el selector de reportes.

## Módulos reales

- `auth/`: `AuthController`, `AuthService` y guards de `security.ts`. Registro crea identidad mediante `IAutenticacion`, perfil Cliente y un evento outbox.
- `properties/`: catálogo público y CRUD administrativo, imágenes y períodos bloqueados. `PropertiesService` verifica propiedad del administrador en vez de confiar en un `propietario_id` enviado por cliente.
- `availability/`: `lockProperty`, `expireProperty`, `assertAvailable` y `AvailabilityService`.
- `reservations/`: `ReservationsService.create` valida rol, toma lock, valida estadía, vence temporales, comprueba disponibilidad y guarda.
- `payments/`: `PaymentsService` crea checkout y procesa webhooks; `WebhookController` recibe Mercado Pago.
- `cancellations/` y `reports/`: reglas de cancelación y consultas administrativas.
- `jobs/`: `expiration.job.ts` cada 30 s y `outbox.job.ts` cada 5 s.

Los decoradores `@Controller`, `@Get`, `@Post`, `@Body`, `@UseGuards`, `@Roles` y `@CurrentUser` convierten clases en endpoints y aplican autorización. Los repositories de TypeORM se obtienen desde `DataSource`; no hay una capa repository propia adicional.

Si un controller tuviera reglas complejas, sería difícil reutilizarlas desde jobs o tests. Si el service saltara DTOs/guards, se perderían validación y seguridad. Consultá [KEY-CODE-WALKTHROUGH.md](KEY-CODE-WALKTHROUGH.md) para fragmentos concretos.
