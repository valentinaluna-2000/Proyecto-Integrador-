# Inventario demo verificado — 29/09/2026

Se conservó el seed existente. Se agregaron tres reservas y cuatro pagos; uno pendiente se asoció a la reserva temporal preexistente. No se modificaron credenciales, propiedades ni reservas anteriores.

1 propietario (Rentify Demo), 1 administrador (Administración Demo), 1 cliente (Cliente Demo), 6 propiedades y 6 imágenes.

## Propiedades

| Nombre | Tipo | Huéspedes | Precio/noche ARS | Seña % |
|---|---|---:|---:|---:|
| Refugio de las Sierras | cabaña | 4 | 72000.00 | 30.00 |
| Casa del Lago | casa | 6 | 110000.00 | 40.00 |
| Balcón de Palermo | departamento | 2 | 65000.00 | 25.00 |
| Entre Viñedos | quinta | 8 | 155000.00 | 50.00 |
| Bosque y Montaña | cabaña | 4 | 92000.00 | 30.00 |
| Brisa del Mar | departamento | 3 | 58000.00 | 35.00 |

## Reservas y pagos

Las fechas de salida son exclusivas. Todos los pagos DEMO son datos ilustrativos, no cobros reales.

| ID | Propiedad | Desde | Hasta | Estado | Pago |
|---:|---|---|---|---|---|
| 1 | Refugio de las Sierras | 2026-10-05 | 2026-10-08 | CONFIRMADA | APROBADO |
| 2 | Casa del Lago | 2026-10-08 | 2026-10-11 | CONFIRMADA | APROBADO |
| 3 | Balcón de Palermo | 2026-10-11 | 2026-10-14 | CONFIRMADA | APROBADO |
| 4 | Entre Viñedos | 2026-10-14 | 2026-10-17 | CANCELADA | APROBADO |
| 5 | Bosque y Montaña | 2026-10-17 | 2026-10-20 | CONFIRMADA | APROBADO |
| 6 | Brisa del Mar | 2026-10-20 | 2026-10-23 | CONFIRMADA | APROBADO |
| 7 | Bosque y Montaña | 2026-10-20 | 2026-10-30 | TEMPORAL | PENDIENTE |
| 8 | Refugio de las Sierras | 2026-11-03 | 2026-11-05 | VENCIDA | RECHAZADO |
| 9 | Refugio de las Sierras | 2026-09-15 | 2026-09-17 | CONFIRMADA | APROBADO |
| 10 | Refugio de las Sierras | 2026-11-08 | 2026-11-10 | CANCELADA | APROBADO |

Totales: 10 reservas (6 CONFIRMADA, 1 TEMPORAL, 1 VENCIDA, 2 CANCELADA); 10 pagos (8 APROBADO, 1 PENDIENTE, 1 RECHAZADO). Una estadía histórica y nueve futuras al verificar.

La reserva temporal #7 vence el 29/09/2026 a las 01:48:07 de Argentina. El job normal podrá pasarla a VENCIDA. Repetir el seed no renueva plazos, restablece estados ni duplica escenarios ya cargados. Para demostrar una nueva temporal tras vencer, crear una reserva mediante el flujo normal.

## Bloqueos

| Propiedad | Desde | Hasta |
|---|---|---|
| Refugio de las Sierras | 2026-11-12 | 2026-11-15 |
| Casa del Lago | 2026-11-12 | 2026-11-15 |
| Balcón de Palermo | 2026-11-12 | 2026-11-15 |
| Entre Viñedos | 2026-11-12 | 2026-11-15 |
| Bosque y Montaña | 2026-11-12 | 2026-11-15 |
| Brisa del Mar | 2026-11-12 | 2026-11-15 |

## Cancelaciones

- Reserva #4: ADMINISTRADOR; requiere reintegro: sí.
- Reserva #10: CLIENTE; requiere reintegro: sí.

## Reportes y validación

Para demostrar los cinco reportes, usar desde 01/09/2026 hasta 01/12/2026 (fin exclusivo). Resultados: 10 reservas, 8 pagos aprobados por ARS 708.150,00, 17 noches confirmadas, ocupación 3,11 %, 2 cancelaciones y desempeño de las 6 propiedades.

Se comprobaron cero cruces entre reservas activas y cero cruces entre reservas activas y bloqueos. El seed se ejecutó dos veces contra Supabase y la comparación de todos los registros de las nueve tablas de negocio resultó idéntica. Build y lint aprobados; 46 pruebas unitarias/API y 12 de integración aprobadas sobre PostgreSQL descartable. La nueva prueba verifica los cuatro estados, los tres estados de pago, estadía histórica, cancelación del cliente, respeto de un bloqueo existente e idempotencia completa.
