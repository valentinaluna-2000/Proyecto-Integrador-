# Construir un sistema similar desde cero

1. **Base:** aprendé TypeScript, HTTP, SQL, Nest y Angular. Creá API `/health` y SPA.
2. **Modelo:** diseñá entidades y migraciones PostgreSQL; practicá FKs, checks e índices.
3. **Propiedades:** implementá CRUD y catálogo público; aprendé DTO/validación/roles.
4. **Auth:** integrá un proveedor como Supabase; vinculá identidad a perfil mediante UUID, nunca contraseña propia.
5. **Reservas:** validá capacidad, fechas y cotización decimal; almacená el precio acordado.
6. **Concurrencia:** implementá rango `[)`, transacción, lock y exclusion constraint. Es la etapa crítica: simulá dos requests paralelos.
7. **Frontend:** creá rutas, estado auth, formularios y detalle; después el calendario como funciones puras testeables.
8. **Pagos:** primero mock gateway; luego Checkout Pro, webhook firmado e idempotencia.
9. **Eventos:** agregá outbox, Kafka, consumer y proveedor SMTP; distinguí persistir, publicar y entregar.
10. **Operación:** Dockerfiles, Compose, secretos, healthchecks, migración/seed y pruebas.

En cada etapa deberías poder explicar el contrato, escribir una prueba y reconstruir un caso pequeño sin copiar. Ejercicios: crear una constraint de rango, implementar un endpoint protegido, simular webhook duplicado, reemplazar Gmail por proveedor falso y dibujar el flujo de fallo de Kafka.
