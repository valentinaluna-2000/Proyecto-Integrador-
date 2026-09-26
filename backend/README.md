# Rentify Backend

Esqueleto de API REST en NestJS + TypeScript basado en el DER y el diagrama de componentes del Seminario Integrador. No incorpora todavía reglas de negocio ni operaciones completas de persistencia.

## Arquitectura

- `presentation-web`: controladores, DTOs y módulos de composición HTTP.
- `business-persistent`: entidades TypeORM y servicios/repositorios asociados a PostgreSQL.
- `business-non-persistent`: adaptadores aislados para Supabase Auth y proveedores externos.

Los nueve módulos de dominio solicitados son: Propietario, Administrador, Cliente, Propiedad, ImagenPropiedad, Reserva, PeriodoBloqueado, Pago y Cancelacion. La autenticación no crea un décimo modelo de usuario: Supabase Auth gestiona credenciales y sesiones; Cliente y Administrador conservan su perfil local enlazado por `auth_user_id`.

## Arranque

1. Copiar `.env.example` como `.env` y completar credenciales.
2. Crear/configurar las tablas en Supabase PostgreSQL mediante migraciones (pendiente).
3. Instalar dependencias con `npm install`.
4. Ejecutar `npm run start:dev`.

TypeORM se conecta al endpoint PostgreSQL de Supabase. `synchronize` permanece desactivado: los cambios de esquema deben implementarse con migraciones revisadas. Configurar `DATABASE_SSL=true` en los entornos que requieran TLS. Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente web.

## Supabase Auth

El módulo `auth` delega registro, login, verificación de email, recuperación/cambio de contraseña y cierre de sesión a Supabase Auth. La API recibe el token de acceso emitido por Supabase y lo valida con `auth.getUser`; no implementa firma, emisión ni validación JWT propia. Configurar los redirect URLs y plantillas de correo desde Supabase.

## Esquema inicial

El mapeo refleja las columnas y relaciones del DER. Los campos `numeric` de PostgreSQL se representan como `string` en TypeScript para evitar pérdida de precisión. `auth.users` es propiedad de Supabase y no se modela como entidad TypeORM. Las reglas de negocio ausentes están señaladas con `TODO`, incluyendo concurrencia, vencimientos, autorización por propietario, notificaciones y confirmación de pagos.

La entidad Cancelacion conserva las dos FK opcionales y señala la regla XOR del DER en un TODO: exactamente una de `administrador_id` o `cliente_id` debe tener valor. Completarlo con una restricción/migración PostgreSQL.

## Integraciones externas

`integrations` reúne adaptadores para Mercado Pago (credencial de prueba), Open-Meteo, Google Maps Embed y Resend. Son interfaces esqueleto; falta implementar HTTP, validación de webhooks, manejo de secretos, reintentos y observabilidad.
