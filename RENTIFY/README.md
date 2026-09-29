# Rentify

Aplicación de alquileres temporarios para un Trabajo Práctico Final. Interfaz en español, importes en ARS, fechas de estadía como `date` y horarios visuales en `America/Argentina/Cordoba`.

El proyecto está directamente en **C:\RENTIFY**, con `frontend/` y `backend/`. Abrí esa carpeta en Visual Studio Code. No hay un ZIP ni otra carpeta Rentify anidada.

## Qué incluye

- Catálogo público, filtros por destino, fechas, precio, huéspedes, mascotas y menores.
- Detalle con imágenes, disponibilidad, precio, seña, Google Maps y Open-Meteo.
- Registro, verificación, reenvío, recuperación, sesión persistente, cierre de sesión, perfil y cambio de contraseña con Supabase Auth.
- Intención de reserva conservada en el navegador hasta iniciar sesión.
- Reservas temporales de **90 minutos**, pagos Checkout Pro TEST, confirmación por webhook, vencimiento y cancelación.
- Administración de propiedades, fotos, precios, señas, estado y períodos bloqueados.
- Reservas, pagos, cancelaciones y cinco reportes limitados al propietario del administrador.
- Migración PostgreSQL, RLS, constraints, índices, seed y pruebas automatizadas.
- Productor Kafka real, consumidor Nest separado, Gmail SMTP, outbox transaccional, reintentos, idempotencia y DLQ.

No se procesan reintegros. `requiere_reintegro` y `requiere_revision` señalan una tarea administrativa. Un pago aprobado tardío se registra, pero nunca vuelve a ocupar fechas liberadas.

## Inicio principal: Docker Compose

Requiere Docker Desktop iniciado con motor Linux y el archivo raíz .env configurado. Node/npm locales solo son necesarios para desarrollo individual y tests. Supabase PostgreSQL/Auth/Storage, Gmail, Mercado Pago, Maps y Open-Meteo permanecen externos.

Desde PowerShell:

```powershell
cd C:\RENTIFY
docker compose up -d --build
docker compose ps
docker compose logs -f
# Ctrl+C solo deja de seguir logs; los servicios siguen funcionando.
docker compose logs -f backend
docker compose logs -f worker
# Detener contenedores y eliminar su red:
docker compose down
# Reconstruir e iniciar nuevamente:
docker compose up -d --build
```

No hace falta abrir terminales separadas para API, worker o frontend. No reemplazar el .env existente con .env.example: ese archivo es una plantilla sin secretos.

| Servicio | Función y dependencia |
|---|---|
| kafka | Broker KRaft; volumen kafka-data en /var/lib/kafka/data (directorio escribible por el usuario de la imagen) y healthcheck |
| kafka-init | Crea los tres topics si faltan, después de Kafka healthy |
| migrate | Migraciones pendientes con lock PostgreSQL e inicialización idempotente de Storage |
| seed | Termina correctamente sin hacer cambios salvo RUN_SEED=true y NODE_ENV=development |
| backend | API Nest; espera migrate/seed correctos y Kafka healthy; healthcheck /health |
| worker | Misma imagen que backend; espera API/Kafka y ejecuta el consumidor real |
| frontend | Angular compilado servido por Nginx; espera API healthy; healthcheck /healthz |

Los tres servicios de inicialización deben terminar con código 0. Verlos con `docker compose ps -a`; no deben permanecer ejecutándose. Si migrate/seed falla, Compose no inicia la API. Después de corregir configuración, repetir down y up. El seed utiliza un lock y conserva identidades/datos ya existentes. RUN_SEED=false es el valor de la plantilla; en este entorno de desarrollo se habilitó RUN_SEED=true con las credenciales demo existentes.

La API y el worker leen .env mediante un montaje de solo lectura en /run/secrets/rentify_env. Compose establece PORT=3000 y KAFKA_BROKERS=kafka:29092 dentro de sus contenedores, conservando el .env para uso local. NODE_ENV se toma del .env (development por defecto). El navegador usa /api; Nginx lo dirige internamente a backend:3000. La URL pública BACKEND_URL se usa para las notificaciones externas y no para resolver contenedores. No se incluyen secretos en contextos de build, imágenes o frontend. Los secretos de Compose son archivos montados, no un almacén cifrado.

Puertos publicados solo en loopback: frontend 4200, API 3000 y Kafka 9092 para debug local. Sin ZooKeeper ni base de datos local en Compose. `docker compose down` conserva kafka-data, archivos locales y todos los datos externos; no usar down -v como parada normal. Docker Desktop continúa abierto como motor, pero los servicios de Rentify quedan detenidos.

- Frontend: http://localhost:4200
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Salud: http://localhost:3000/health

/health confirma que la API arrancó después de conectar PostgreSQL; no certifica Gmail ni Mercado Pago. La entrega real de correos necesita el worker.

### Desarrollo individual sin Docker completo

Los scripts npm existentes se conservan. Para usar procesos Node locales, levantar solamente Kafka y sus topics con `docker compose up -d kafka kafka-init`, ejecutar builds en backend/frontend, migrar con `npm --prefix backend run migration:run` y usar `npm --prefix backend start`, `npm --prefix backend run worker` y `npm --prefix frontend start` en terminales separadas. No combinar estos servidores con los contenedores que usan los mismos puertos. Este modo es opcional para debug.

### Build y desarrollo en Windows

`npm run build` del frontend ejecuta el compilador Angular AOT (`ngc`) y esbuild nativo por CLI, sin servicio hijo con pipes. Esta variante se incorporó porque el entorno de ejecución de Windows devolvió `spawn EPERM` con `ng build`. Incluye el compilador para las dependencias Angular parcialmente compiladas y transforma `async/await` para Zone.js. Genera un bundle sin división de código y los assets en `frontend/dist/rentify/browser`.

La configuración estándar de Angular CLI también está disponible:

```powershell
# Frontend: recompilación automática con Angular CLI, cuando el entorno permite sus procesos
npm run start:cli
# Build de Angular CLI con linker y optimizaciones estándar
npm run build:cli
```

No ejecutes ambos servidores frontend en el mismo puerto. El servidor de `npm start` sirve el build ya generado y hace proxy `/api` a `127.0.0.1:3000`; no observa cambios. Repetí el build después de editar. Es un servidor local de desarrollo, no un servidor público de producción. Para otro puerto backend, iniciá el frontend con `BACKEND_PORT` configurado.

En el backend `npm run start:dev` y `npm run worker:dev` usan tsx watch. También podés usar `npm run build` seguido de `npm start`/`npm run worker`.

## Variables de entorno

Para iniciar el entorno se requieren DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SMTP_USER, SMTP_APP_PASSWORD y SMTP_FROM. Las demás opciones de conexión tienen los defaults documentados. MERCADOPAGO_ACCESS_TOKEN y BACKEND_URL HTTPS son necesarios para pagos; MERCADOPAGO_WEBHOOK_SECRET también es obligatorio para arrancar en production. Las cuatro DEMO_* se requieren solo si RUN_SEED=true. GOOGLE_MAPS_EMBED_API_KEY y TEST_DATABASE_URL son opcionales: vacíos no bloquean el arranque. MERCADOPAGO_PUBLIC_KEY se conserva aunque Checkout Pro redirigido no la necesita. RENTIFY_ENV_FILE es una opción interna del contenedor, no una credencial que deba agregarse al .env.

Solo el archivo raíz `.env` contiene configuración privada. Está excluido de Git. No coloques secretos en archivos Angular ni en `frontend/public/config.json`.

| Variable | Valor/uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL de Supabase con usuario y contraseña; codificar caracteres especiales de la contraseña |
| `DATABASE_SSL` | `true` para Supabase; verifica CA y hostname. La CA pública oficial está incluida en backend/certs |
| `DATABASE_SSL_CA_FILE` | Opcional: ruta relativa a backend; por defecto certs/supabase-ca.crt. Para otra CA, colocar el certificado público en backend/certs y reconstruir |
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_ANON_KEY` | Clave pública anon/publishable, utilizada solamente para Auth en Angular |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada service role/secret, solo backend y seed |
| `FRONTEND_URL` | `http://localhost:4200` en desarrollo, sin barra final |
| `BACKEND_URL` | URL HTTPS pública de la API para Mercado Pago, sin barra final |
| `PORT` | `3000` |
| `KAFKA_BROKERS` | `localhost:9092` al correr procesos localmente |
| `KAFKA_CLIENT_ID` / `KAFKA_GROUP_ID` | `rentify` / `rentify-email-v1` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `smtp.gmail.com` / `465` / `true` |
| `SMTP_USER` / `SMTP_FROM` | Cuenta Gmail dedicada y remitente de esa cuenta |
| `SMTP_APP_PASSWORD` | Contraseña de aplicación de Google; nunca contraseña habitual |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial de prueba: TEST- o cuenta verificada por /users/me con tag test_user; cuentas reales bloqueadas |
| `MERCADOPAGO_PUBLIC_KEY` | Clave pública TEST de la aplicación; reservada para integraciones del SDK, Checkout Pro redirigido no la requiere |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secreto de firma de notificaciones |
| `GOOGLE_MAPS_EMBED_API_KEY` | Clave restringida a Embed API y a los referers de la aplicación |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com` |
| `SUPABASE_STORAGE_BUCKET` | `property-images` |
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Credenciales que vos elegís para el administrador de prueba |
| `DEMO_CLIENT_EMAIL` / `DEMO_CLIENT_PASSWORD` | Credenciales que vos elegís para el cliente del seed |
| `TEST_DATABASE_URL` | PostgreSQL descartable cuyo nombre empieza por `rentify_test`, exclusivamente para pruebas |
| `NODE_ENV` | `development`; seed exige exactamente ese entorno |
| `RUN_SEED` | Opcional, false por defecto; true habilita datos demo exclusivamente en development |

`GET /config` expone únicamente URL/clave pública de Supabase y clave restringida de Maps. Nunca expone service role, token de Mercado Pago ni contraseña SMTP. Angular no consulta tablas de negocio con Supabase: todas esas consultas pasan por NestJS.

## Configurar Supabase

1. Crear un proyecto de desarrollo en [Supabase](https://supabase.com/dashboard).
2. Obtener la cadena PostgreSQL desde Connect. Usar conexión directa o **session pooler**, evitando el transaction pooler para las migraciones. Completar `DATABASE_URL`; mantener TLS. El usuario de migración necesita crear tablas, FK a `auth.users`, índices, RLS y la extensión `btree_gist`.
3. Completar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. La clave privada se usa únicamente en el servidor.
4. En Authentication, habilitar email/password y **Confirm email**. Exigir contraseña mínima de 8 caracteres con letras y números; el formulario y registro también lo validan. La verificación de `email_confirmed_at` se vuelve a controlar en Nest.
5. Configurar Site URL como `http://localhost:4200` y permitir exactamente estas redirecciones (agregar sus equivalentes HTTPS si se despliega):
   - `http://localhost:4200/auth/verificado`
   - `http://localhost:4200/auth/restablecer-contrasena`
6. Compose ejecuta automáticamente las migraciones antes de la API; para uso local, ejecutar build y `npm run migration:run`. `synchronize` está desactivado. La migración es versionada; no copiar tablas manualmente sobre un esquema existente.
7. El servicio migrate crea el bucket público `property-images` si no existe, incluso con RUN_SEED=false. Nunca elimina un bucket ni modifica la configuración de uno existente; si es privado, exige revisarlo manualmente. Máximo 5 MB, MIME `image/jpeg` e `image/png`. Las escrituras pasan exclusivamente por el backend con autorización por propietario; no agregar políticas públicas de upload. La aplicación valida extensión, MIME, tamaño y firma inicial de archivo. No admite SVG.

Todas las tablas de negocio tienen RLS activado y se revocan permisos para `anon`/`authenticated`. La conexión privada de Nest utiliza el rol servidor de PostgreSQL. No usar esa conexión en el frontend. Los índices y restricciones están en `backend/src/persistence/migrations/1780000000000-Initial.ts`.

El registro crea la identidad con `email_confirm:false` y genera un enlace oficial `generateLink(type: signup)`. El reenvío utiliza el mismo mecanismo para la cuenta ya creada, sin conocer ni cambiar su contraseña. El SDK de Supabase valida JWT contra Auth (`getUser`) y su identidad equivale al claim `sub`.

## Configurar Gmail App Password

1. Crear una cuenta Gmail exclusiva, por ejemplo `rentify.proyecto@gmail.com` (el ejemplo no es una credencial entregada).
2. Entrar a la seguridad de la cuenta Google y activar la verificación en dos pasos.
3. Abrir [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords), crear una denominada Rentify y copiar la contraseña generada.
4. Completar `SMTP_USER`, `SMTP_FROM` y `SMTP_APP_PASSWORD` en `.env`.
5. Mantener `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`.
6. Reiniciar el worker. Si Google no ofrece contraseñas de aplicación, revisar restricciones de la cuenta/administrador y usar una cuenta que las admita.

**Nunca usar la contraseña normal de Gmail ni subir la App Password a Git.** El remitente debe corresponder a la cuenta autorizada. Gmail puede imponer cuotas, controles antispam y demoras externas. Los tests mockean el proveedor; no envían correos reales.

## Kafka, verificación y recuperación

Flujo real:

```text
Angular → Nest Auth → Supabase Auth crea identidad/enlace
                    → transacción PostgreSQL: Cliente + email_outbox
OutboxJob → Kafka → NotificadorEmail (@EventPattern) → IEmailProvider → Gmail SMTP
Usuario abre el enlace → Supabase valida → Angular muestra verificación / recovery
```

La API nunca invoca Nodemailer. Kafka transporta eventos; Supabase verifica la cuenta; Gmail entrega el correo.

Compose usa Apache Kafka en KRaft, almacenamiento persistente, healthcheck y creación de topics:

- `rentify.auth.email-verification.requested`
- `rentify.auth.password-recovery.requested`
- `rentify.notifications.dlq`

Los eventos incluyen `eventId`, `version: 1`, `type`, `recipient`, `recipientName`, `actionUrl`, `createdAt`. No incluyen passwords ni access/refresh tokens. Los enlaces son secretos de un solo uso: no imprimir el contenido de los topics en una demostración pública.

```powershell
Set-Location C:\RENTIFY
docker compose up -d
docker compose logs kafka-init
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --list
docker compose exec kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server kafka:29092 --describe --group rentify-email-v1-server
```

Nest agrega el sufijo `-server` al grupo consumidor. `kafka:29092` es la dirección interna para contenedores; `localhost:9092` es la dirección de los procesos ejecutados en tu PC.

Para demostrar el flujo:

1. Ejecutar API, worker y Kafka.
2. Registrarse desde Angular con una dirección real propia.
3. Intentar login antes de verificar: debe ser rechazado.
4. Ver en la terminal API `Evento publicado: <eventId>` y en la del worker `Email aceptado por SMTP: <eventId>`.
5. Comprobar el correo recibido y hacer clic en **VERIFICAR MI CUENTA**.
6. Supabase valida el enlace y redirige a `/auth/verificado`. Angular comprueba el usuario confirmado, cierra la sesión automática del callback y permite iniciar sesión explícitamente.
7. Iniciar sesión. Si se había intentado reservar, se restauran propiedad, fechas y huéspedes guardados en el navegador.
8. Repetir con **Olvidé mi contraseña**. El correo lleva a `/auth/restablecer-contrasena`; Supabase consume el enlace y permite `updateUser`. No hay códigos numéricos propios ni tokens inventados.

El outbox se publica cada 5 segundos y sigue pendiente si Kafka falla. Al publicar, se borra del outbox el payload con el enlace. El worker reintenta SMTP tres veces y luego publica en DLQ. Solo registra `email_receipts` si SMTP aceptó el correo. La API permanece disponible si el worker/Gmail se cae. Retención de topics: 24 horas.

Tras corregir SMTP, reprocesar la DLQ con:

```powershell
Set-Location C:\RENTIFY\backend
npm run dlq:replay
# Ctrl+C cuando se hayan republicado los eventos retenidos.
```

Se conserva el `eventId`, por lo que los correos ya registrados como enviados no se vuelven a enviar. SMTP no ofrece una transacción atómica con PostgreSQL: una caída exacta entre aceptación SMTP y commit puede ocasionar reentrega. Los enlaces expirados requieren un nuevo reenvío desde el formulario.

## Mercado Pago TEST

1. Crear una aplicación en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app).
2. Obtener las credenciales del vendedor de prueba y completar `MERCADOPAGO_ACCESS_TOKEN`. El prefijo por sí solo no determina una cuenta de prueba: para credenciales distintas de TEST-, Rentify consulta /users/me y exige el tag test_user antes de operar. MERCADOPAGO_PUBLIC_KEY se conserva para futuras integraciones SDK; el checkout redirigido actual no la consume.
3. Configurar una URL HTTPS pública que redirija a la API local o a una instalación de prueba. Colocarla en `BACKEND_URL`. El navegador usa el proxy local; Mercado Pago necesita una dirección alcanzable desde Internet.
4. En Tus integraciones → aplicación del vendedor de prueba → Webhooks → Configurar notificaciones, registrar `https://tu-api/payments/mercadopago/webhook` y seleccionar **Pagos**. Con cuenta vendedora de prueba, usar la pestaña Modo productivo de esa cuenta ficticia. Guardar configuración, revelar la clave secreta y copiarla a `MERCADOPAGO_WEBHOOK_SECRET` en el .env local. Reiniciar con down y up -d --build, y utilizar Simular para comprobar recepción. No hace falta compartir el secreto en el chat. [Guía oficial de notificaciones](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/payment-notifications).
5. Crear una reserva y presionar **Pagar seña con Mercado Pago**. Se genera una preferencia por el importe exacto de la seña y `external_reference=reserva.id`. Solo se devuelve `sandbox_init_point`.
6. Utilizar cuentas/tarjetas de prueba vigentes de la [documentación oficial de pruebas de Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test). No usar tarjetas propias ni dinero real.
7. Probar resultado aprobado y rechazado. Volver al detalle y presionar **Actualizar estado del pago**. Una redirección `success` nunca confirma por sí sola.

Si MERCADOPAGO_WEBHOOK_SECRET está vacío, el checkout y webhook responden 503 y nunca aceptan pagos sin firma. En NODE_ENV=production la inicialización y la API se niegan a arrancar sin ese secreto.

El webhook valida HMAC de `x-signature`, `x-request-id`, `data.id` y timestamp, consulta el pago en Mercado Pago, exige `live_mode=false`, ARS, referencia válida y monto exacto. Dentro de una transacción con el mismo lock de propiedad, guarda el pago e intenta confirmar únicamente si la reserva aún es temporal y vigente. La referencia de transacción es única. Las notificaciones repetidas no duplican ingresos.

Un pago rechazado o pendiente no confirma. Se permite otro intento mientras no venza la reserva. Un pago aprobado fuera de término queda visible para revisión administrativa; no se procesa refund.

## Maps y clima

En Google Cloud, crear clave, habilitar **Maps Embed API** y restringir la clave a esa API y a los referers autorizados, por ejemplo `http://localhost:4200/*`. Completar `GOOGLE_MAPS_EMBED_API_KEY`. Esta clave es necesariamente visible en el iframe: las restricciones se aplican en Google Cloud. La dirección siempre se muestra como texto.

Open-Meteo se consulta desde Nest con timeout de 4 segundos y cache de 15 minutos. Se muestran mínimas/máximas, precipitación, condición y viento. Fuera de los próximos 16 días se informa que aún no hay pronóstico. Fallas de Maps o clima no impiden crear una reserva.

## Administrador y datos demo

No existe registro público de administradores. El seed crea:

- Propietario **Rentify Demo**.
- Administrador **Administración Demo**, titular de ese propietario.
- Cliente **Cliente Demo**.
- Seis propiedades en Córdoba, Buenos Aires, Mendoza, Bariloche y Mar del Plata.
- Tipos casa, departamento, cabaña y quinta; precios/capacidades/señas variados.
- Reservas confirmadas, una cancelada, pagos aprobados y períodos de mantenimiento.

El usuario administrador es el email que configures en **`DEMO_ADMIN_EMAIL`**. Su contraseña es **`DEMO_ADMIN_PASSWORD`**. No se entrega una contraseña fija ni se inventan credenciales. El seed confirma esos emails exclusivamente para la demostración. El registro público conserva la verificación obligatoria.

Los pagos del seed tienen referencias `DEMO-*` y son datos demostrativos, no transacciones realizadas en Mercado Pago. Las imágenes iniciales son ilustrativas de Unsplash; las fotos subidas por el administrador se almacenan en Supabase Storage. Si no hay imagen o falla una URL, el catálogo muestra una ilustración local.

El seed es repetible: reutiliza usuarios ya asociados y propiedades por nombre/propietario, sin borrar datos existentes. Para cambiar contraseñas de usuarios ya creados, usar recuperación de Supabase; volver a ejecutar el seed no las reemplaza.

## Arquitectura y reglas

| Módulo | Responsabilidad |
|---|---|
| GestionUsuarios | Registro, verificación, recuperación, perfil, JWT y roles |
| GestionPropiedades | CRUD, estado, imágenes y pertenencia al propietario |
| GestionDisponibilidad | Solapamientos, locks y vencimiento |
| GestionReservas | Cotización decimal y creación de reservas |
| GestionCancelaciones | Plazo de 72 h, actor, excepciones y bandera administrativa |
| GestionPagos | Checkout, conciliación del webhook y consultas |
| GestionReportes | Reservas, ingresos, ocupación, cancelaciones y desempeño |
| IntegracionPasarelaPago | Adaptador Checkout Pro TEST y validación de firmas/pagos externos |
| IntegracionServiciosExternos | Adaptadores Supabase, Mercado Pago, Open-Meteo, Kafka y Storage |
| ProcesosImportadoresYNotificadores | Outbox, job de vencimiento y worker de correo |
| Persistencia | DataSource TypeORM, entidades y migración PostgreSQL |

Los contratos están en `backend/src/common/ports.ts`. `IAutenticacion`, `PaymentGateway`, `ImageStorage`, `EventPublisher`, `WeatherProvider` e `IEmailProvider` se inyectan; los servicios de negocio no importan SDK externos. La integración de pasarela se implementa en `integrations/mercadopago` y se expone al módulo de pagos. El proveedor Gmail solo se instancia en el worker.

El propietario se deriva del perfil administrativo validado, nunca del body. Clientes solo consultan y cancelan sus reservas. Los guards Angular son navegación/UX; la protección efectiva está en los guards y servicios de Nest.

**Concurrencia:** se toma `pg_advisory_xact_lock(71001, propiedad_id)` dentro de una transacción antes de revisar disponibilidad e insertar/modificar. Reservas, bloqueos, cancelaciones, pagos y vencimientos comparten ese lock. Una exclusion constraint GiST sobre `daterange(..., '[)')` protege reservas temporales/confirmadas incluso ante inserciones accidentales fuera del servicio. Una reserva que termina el día 5 es compatible con otra que ingresa el día 5. Las temporales vencidas se actualizan antes de insertar para liberar la constraint.

**Dinero:** `numeric(14,2)` en PostgreSQL y `decimal.js` para cotizar. Se guardan total y seña al crear la reserva; cambios posteriores de tarifa no alteran importes ya acordados. El SDK HTTP de Mercado Pago recibe un número JSON únicamente en el borde de integración.

**Cancelaciones:** normal hasta 72 horas antes de la hora local de ingreso. La excepción requiere administrador y motivo; tampoco permite cancelar una estadía iniciada. Una constraint exige exactamente un actor, otra impide más de una cancelación por reserva.

**Reportes:** rango `[desde, hasta)`. Ingresos incluyen exclusivamente pagos aprobados por fecha de pago. Ocupación = noches confirmadas que intersectan el rango / (propiedades seleccionadas × noches del rango); incluye el inventario seleccionado completo, sin descontar mantenimiento. Cancelaciones se filtran por fecha de cancelación. La tabla de cancelaciones muestra motivo, tipo de actor y condición excepcional. No confundir ingresos por señas con el valor total contratado de las estadías.

**Seguridad:** Helmet, CORS con el origen configurado, rate limiting, DTO whitelist, TypeScript strict, SQL parametrizado/TypeORM, logs sanitizados y manejo global de errores en español. No se almacenan contraseñas en tablas Rentify, Kafka ni logs. El outbox y los topics contienen temporalmente enlaces de autenticación: son privados y no deben hacerse públicos.

## Pruebas y verificación

```powershell
Set-Location C:\RENTIFY\backend
npm run build
npm test
npm run lint

# Base separada y descartable. El nombre debe empezar por rentify_test.
$env:TEST_DATABASE_URL='postgresql://usuario:clave@localhost:5432/rentify_test'
npm run test:integration

Set-Location C:\RENTIFY\frontend
npm run build
npm run lint
```

Los tests de integración **truncan las tablas de la base de prueba**. Nunca apuntar `TEST_DATABASE_URL` a Supabase ni a una base con datos útiles. La suite crea un esquema `auth.users` mínimo para FKs y roles `anon`/`authenticated`; requiere un usuario PostgreSQL con esos permisos. Si no hay URL, Jest marca esa suite omitida; no es un resultado de integración aprobado.

Cobertura funcional: creación de identidad Supabase mediante mocks, registro/perfil/evento sin password, recovery, reenvío, JWT verificado/no verificado, permisos, acceso público, DTOs, consumidor, SMTP simulado, reintentos, DLQ, outbox, precisión decimal, cancelaciones, HMAC, aprobado/rechazado/pendiente, idempotencia, pagos tardíos, clima y cache. La suite PostgreSQL prueba carreras reales entre reservas/bloqueos/webhooks, constraints, intervalos adyacentes, vencimientos, autorización y reportes.

Verificación de esta configuración Docker:

- Builds backend/frontend y lint aprobados; 46 pruebas unitarias/API y 11 de integración en PostgreSQL local descartable aprobadas. TEST_DATABASE_URL del .env permanece vacío.
- PostgreSQL externo conectado con TLS y hostname verificados; migración aplicada y segunda ejecución con 0 pendientes.
- Supabase Auth: clave pública, service role y confirmación de email comprobados; Gmail SMTP autenticó sin enviar correos; Open-Meteo respondió.
- Bucket público inicializado y seed demo ejecutado; repetición comprobada sin duplicar registros. Credenciales originales conservadas; .env ignorado y sin secretos reales encontrados fuera de él en fuentes/documentación.
- Con procesos Node locales: HTTP 200 en frontend, /health, /docs y proxy /api/properties; inicio de sesión real de ambos usuarios demo y roles ADMINISTRADOR/CLIENTE verificados. Estos procesos temporales se detuvieron después de validar.
- Compose válido con docker compose config --quiet. Los intentos de down, up -d --build y ps fueron rechazados por el sandbox al acceder al pipe dockerDesktopLinuxEngine. Docker Desktop está iniciado, pero esta sesión no pudo ejecutar contenedores. No se considera probado el build Linux, networking Docker ni transporte real de Kafka.
- Quedan pendientes el envío/recepción real de emails y Checkout/webhook con URL HTTPS pública y secreto; Maps y base de tests son opcionales para la aplicación.

## Referencias oficiales

- [Supabase: TLS y certificados](https://supabase.com/docs/guides/platform/ssl-enforcement)
- [Compose: dependencias y readiness](https://docs.docker.com/compose/how-tos/startup-order/)
- [Compose: secretos montados](https://docs.docker.com/compose/how-tos/use-secrets/)
- [Supabase: generación oficial de enlaces](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Supabase Auth: implementación del reenvío signup sin cambiar contraseña](https://github.com/supabase/auth/blob/master/internal/api/mail.go)
- [Mercado Pago: notificaciones Checkout Pro y firma](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/payment-notifications)
- [Open-Meteo](https://open-meteo.com/en/docs)
- [Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)

## Resolver problemas frecuentes

- **API no inicia:** completar `DATABASE_URL`, URL/clave privada Supabase; revisar TLS, contraseña URL-encoded y conectividad. No desactivar validación de certificados para Supabase.
- **Correo no llega:** comprobar primero outbox/publicación, después grupo consumidor, después Gmail App Password/spam. No imprimir enlaces o payloads para depurar.
- **Kafka no conecta:** Docker Desktop debe estar abierto; esperar healthcheck e init. Usar el listener correcto según proceso local/contenedor.
- **Cuenta sin verificar:** verificar Confirm email en Supabase y el callback permitido. Usar el reenvío de Rentify.
- **Mercado Pago no confirma:** configurar URL pública/secreto; verificar que el pago sea TEST, ARS, monto de seña y reserva vigente. El retorno del navegador no basta.
- **Maps no aparece:** verificar API habilitada y restricciones del referer. La dirección y reserva siguen disponibles.
- **Cambios frontend no aparecen:** volver a ejecutar `npm run build`, o usar el servidor CLI con watch en un entorno compatible.

## Documentación para desarrolladores

La documentación técnica y educativa basada en el código actual está en [`docs/`](docs/). Orden sugerido: [visión general](docs/SYSTEM-OVERVIEW.md), [repositorio](docs/REPOSITORY-GUIDE.md), [backend](docs/BACKEND-GUIDE.md), [frontend](docs/FRONTEND-GUIDE.md), [base de datos](docs/DATABASE-GUIDE.md), [autenticación](docs/AUTH-FLOW.md), [reservas](docs/RESERVATION-FLOW.md) y [pagos](docs/PAYMENT-FLOW.md).

- [Kafka y correo](docs/KAFKA-EMAIL-FLOW.md)
- [Docker Compose](docs/DOCKER-GUIDE.md)
- [Servicios externos](docs/EXTERNAL-SERVICES.md)
- [Recorrido por código clave](docs/KEY-CODE-WALKTHROUGH.md)
- [Guía de defensa oral](docs/DEFENSE-GUIDE.md)
- [Cómo construirlo desde cero](docs/BUILD-FROM-SCRATCH.md)
- [Glosario](docs/GLOSSARY.md)
- [Plan de estudio](docs/LEARNING-ROADMAP.md)
