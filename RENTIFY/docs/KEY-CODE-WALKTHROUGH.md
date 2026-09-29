# Recorrido por código clave

1. **Bootstrap** — `backend/src/main.ts`: crea Nest y aplica seguridad transversal. Sin pipe/filtro, DTOs y errores serían inconsistentes.
2. **Módulos** — `app.module.ts`: DI explícita; importar mal un módulo produce provider no disponible.
3. **Guard** — `auth/security.ts`: convierte JWT en `Actor`; sin él un id enviado por cliente sería una escalada de privilegios.
4. **Registro** — `auth/auth.service.ts`: identidad, perfil y outbox coordinados; compensa borrando identidad si falla DB.
5. **Disponibilidad** — `availability.service.ts`: `fecha_desde < to AND fecha_hasta > from` expresa intersección `[)`.
6. **Reserva** — `reservations.service.ts`: lock + transacción + quote; sin ellos hay race conditions y montos flotantes.
7. **Migración** — `persistence/migrations/1780000000000-Initial.ts`: schema como código, incluida exclusion constraint.
8. **Webhook** — `payments.service.ts`: firma, consulta remota, idempotencia y confirmación condicional.
9. **Outbox** — `jobs/outbox.job.ts`: publica solo eventos persistidos; evita perder correo si cae Kafka.
10. **Worker** — `notifications/notifier.ts`: retry/receipt/DLQ; Kafka no manda email.
11. **API frontend** — `frontend/src/app/core.ts`: token dinámico y traducción de errores.
12. **Calendario** — `frontend/src/app/calendar-domain.ts`: funciones puras para límites, intersección y estado de rango.
13. **Rutas** — `frontend/src/app/routes.ts`: lazy loading y guards de UX.
14. **Compose** — `docker-compose.yml`: ordena infraestructura y tareas de una sola ejecución.

Estos fragmentos usan DI, decorators, transacciones, locks, constraints, mensajes, signals y componentes standalone. Estudialos junto al archivo fuente: son puntos donde una implementación ingenua suele romper seguridad, consistencia o disponibilidad.
