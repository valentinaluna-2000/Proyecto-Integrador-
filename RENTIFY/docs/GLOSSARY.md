# Glosario

- **API/REST/endpoint:** interfaz HTTP; `/properties` es endpoint REST de Rentify.
- **Controller/Service:** borde HTTP/lógica de negocio Nest.
- **DTO/Entity/Repository/ORM:** entrada validada/clase tabla/acceso tabla/mapeo TypeORM.
- **JWT/Guard:** token de identidad/filtro de autorización; `AuthGuard` valida el primero.
- **Dependency Injection:** Nest entrega `DataSource` o puertos a constructores.
- **Supabase:** PostgreSQL, Auth y Storage administrados.
- **Kafka, producer, consumer, topic, worker:** broker, publicador, lector, canal y proceso que consume correo.
- **SMTP:** protocolo usado por Nodemailer/Gmail.
- **Webhook:** aviso de Mercado Pago a la API.
- **Idempotencia:** repetir una operación no duplica efecto.
- **Transaction/lock/race condition:** unidad atómica/bloqueo/coincidencia peligrosa de requests.
- **Migration/seed:** versión de schema/datos reproducibles.
- **Docker/container/image/volume/healthcheck:** empaquetado, proceso aislado, plantilla, datos persistentes y prueba de vida.
- **CORS/RLS:** control de orígenes/políticas de filas PostgreSQL; tablas Rentify niegan anon/authenticated.
- **`[from,to)`:** incluye ingreso y excluye egreso.
