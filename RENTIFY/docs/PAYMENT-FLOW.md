# Pagos Mercado Pago TEST

`POST /reservations/:id/payment` llama `PaymentsService.checkout` y `MercadoPagoPaymentGateway.checkout` crea una preference por la **seña**. Devuelve `sandbox_init_point`; el navegador va a Checkout Pro.

El retorno `success/pending/failure` es solo UX: puede ocurrir sin pago o sin que el servidor haya procesado el aviso. La fuente de verdad es `POST /payments/mercadopago/webhook` en `WebhookController`.

`PaymentsService.webhook` verifica HMAC (`verifySignature`), consulta el pago remoto, exige TEST, ARS, referencia de reserva y monto exacto. Dentro de transacción toma el mismo lock de propiedad, vence temporales, guarda/actualiza `Pago` y confirma solo un `TEMPORAL` aún vigente y aprobado. `pagos.id_transaccion_externa` único y la consulta de pago existente hacen idempotente una notificación repetida. Pendiente/rechazado no confirma; aprobado tardío queda para revisión, no reabre fechas.

Alternativa insegura: confiar en query params de redirección. Se falsifican o llegan antes/después del webhook; por eso el backend valida firma y consulta API oficial.
