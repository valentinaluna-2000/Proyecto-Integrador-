# Guía de defensa oral

## Básico

**¿Por qué NestJS?** Organiza HTTP, DI, guards y módulos; en Rentify `backend/src/app.module.ts` compone el sistema. **¿Qué hace un controller?** Traduce HTTP a llamada de negocio, por ejemplo `ReservationsController`. **¿Qué es DTO?** Contrato validado de entrada, como `ReserveDto`. **¿Por qué Angular?** SPA tipada con routing, formularios y componentes standalone. **¿Por qué no guardan contraseñas?** Supabase Auth administra hashes y JWT; Rentify guarda solo `auth_user_id`.

## Intermedio

**¿Para qué Kafka?** Desacopla persistir el evento de enviar correo. **¿Qué hace el worker?** Consume topics y usa SMTP. **¿Qué hace TypeORM?** Mapea clases entidad a tablas y maneja DataSource/repositories. **¿Cómo se mantiene sesión?** Supabase persiste/renueva sesión y `Auth.syncSession` consulta `/auth/me`. **¿Qué es webhook?** Notificación servidor-a-servidor de Mercado Pago, confirmada con HMAC y consulta remota.

## Avanzado

**¿Cómo evitan superposición?** `ReservationsService.create` toma advisory lock por propiedad, opera en transacción y PostgreSQL impone exclusion GiST sobre `daterange('[)')`. **¿Por qué temporal?** Retiene fechas 90 min mientras el cliente paga; después `JobVencimientoReservas` libera inventario. **¿Qué es idempotencia?** Repetir webhook produce mismo efecto: transacción externa única y pago aprobado existente no se duplica. **¿Por qué outbox?** Evita que un commit exitoso pierda el email por una caída inmediata de Kafka. **¿Qué significa Exited (0)?** Un contenedor de tarea (`migrate`, `seed`, `kafka-init`) terminó exitosamente.

Preguntas para practicar: explicá por qué el redirect no confirma pago; dibujá `[from,to)`; diferenciá guard Angular/Nest; describí qué ocurre si Kafka cae; justificá `numeric` + Decimal; explicá el rol de `auth_user_id`.
