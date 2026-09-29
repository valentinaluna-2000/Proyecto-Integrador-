# Kafka y correo

Kafka es un broker de mensajes. En Rentify desacopla la operación HTTP de enviar un email: el cliente obtiene respuesta aunque SMTP sea lento, y el evento queda persistido en `email_outbox`.

`AuthService` guarda eventos de los tópicos `rentify.auth.email-verification.requested` o `rentify.auth.password-recovery.requested`. `OutboxJob` (`backend/src/jobs/outbox.job.ts`) toma pendientes con `FOR UPDATE SKIP LOCKED`, publica mediante `KafkaPublisher` y marca publicado. `worker.ts` levanta un microservicio Kafka; `NotificadorEmail` recibe los tópicos y `GmailSmtpEmailProvider` usa Nodemailer SMTP. Reintenta tres veces, registra `EmailReceipt` único y publica DLQ si fracasa.

Kafka transporta bytes/eventos; no sabe SMTP ni envía correo. El worker traduce evento a proveedor email.

En `docker-compose.yml`, `kafka` es broker persistente; `kafka-init` crea tres topics y termina correctamente; `worker` consume después de backend/Kafka saludables. `kafka-init` terminado con `Exited (0)` significa que su tarea única se completó.
