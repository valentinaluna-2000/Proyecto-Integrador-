# Rentify — Gestion de Reservas Temporarias de Propiedades

Proyecto Integrador — Seminario Integrador, UTN Villa Maria.
Sistema completo (backend + frontend) para que un propietario administre
propiedades de alquiler temporario y sus clientes puedan reservarlas online,
pagando la sena mediante Mercado Pago.

## Stack tecnico

- **Backend**: NestJS 10 + TypeORM + PostgreSQL 16 (con extension `btree_gist`
  para evitar solapamiento de reservas a nivel de base de datos), JWT, Mercado
  Pago SDK, Nodemailer.
- **Frontend**: Angular 18 (standalone components, signals), SCSS.
- **Infraestructura**: Docker Compose (PostgreSQL, backend, frontend con
  Nginx, MailHog para ver los emails en desarrollo).

## Estructura del repositorio

```
rentify/
├── backend/            # API REST (NestJS)
│   └── src/
│       ├── auth/                 # Login, registro, JWT, recuperacion de contrasena
│       ├── propietarios/         # Entidad Propietario (segun el DER)
│       ├── administradores/      # Entidad Administrador (segun el DER)
│       ├── users/                # Entidad Cliente
│       ├── properties/           # Propiedades (CRUD, filtros, disponibilidad)
│       ├── property-images/      # Carga de imagenes
│       ├── blocked-periods/      # Bloqueo de fechas
│       ├── reservations/         # Reservas (concurrencia, vencimiento, cancelacion)
│       ├── payments/             # Integracion Mercado Pago
│       ├── cancellations/        # Registro de cancelaciones
│       ├── reports/              # Reportes para el administrador
│       ├── integrations/         # Clima (Open-Meteo) y Google Maps
│       └── database/             # Migraciones y seed de datos de ejemplo
├── frontend/            # Aplicacion Angular
│   └── src/app/
│       ├── core/                 # Servicios HTTP, guards, interceptor JWT
│       ├── shared/                # Componentes reutilizables (navbar, toasts, etc.)
│       └── features/              # Paginas: home, propiedades, reservas, admin...
├── docker-compose.yml
└── .env.example
```

## Decisiones de diseno relevantes (por si la catedra pregunta)

El PDF de requisitos, el "Prompt Maestro" y el DER (`.puml`) tenian algunas
tensiones entre si. Las resoluciones adoptadas (documentadas tambien como
comentarios en el codigo) fueron:

1. **Reintegro en cancelacion del propietario**: se registra el caso
   (`Cancellation.generoReintegro = true` cuando hay un pago aprobado) pero
   no se ejecuta una devolucion real contra Mercado Pago, porque el propio
   PDF excluye la gestion de reembolsos del alcance.
2. **Modelo de actores**: se implemento `Propietario` + `Administrador` como
   entidades separadas (segun el DER, que permite varios empleados con
   acceso bajo un mismo titular), en lugar de una unica tabla `User` con rol.
3. **Estado `COMPLETED`**: se agrego un estado adicional (no mencionado
   explicitamente en el PDF) para poder distinguir reservas historicas de
   vigentes en los reportes, asignado automaticamente por un job cuando la
   estadia ya finalizo.
4. **Reintegro en cancelacion excepcional del cliente**: no se automatiza;
   queda registrado como un caso que el administrador puede evaluar
   manualmente (el PDF no define una regla automatica para este caso).

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye
  Docker Compose) — **es la unica forma necesaria** de correr todo el
  sistema con un solo comando.
- [Visual Studio Code](https://code.visualstudio.com/).
- Opcional, solo si queres correr el backend o el frontend **sin Docker**
  para desarrollarlos con recarga en caliente: [Node.js 20+](https://nodejs.org/)
  y una instancia de PostgreSQL 16 accesible.

---

## 1. Ver el codigo en Visual Studio Code

1. Descomprimi el archivo `rentify.zip` que te comparti en una carpeta de tu
   PC (por ejemplo `C:\proyectos\rentify` o `~/proyectos/rentify`).
2. Abri VS Code.
3. Menu **File → Open Folder...** (o `Ctrl+K Ctrl+O`) y selecciona la carpeta
   `rentify` (la que contiene `backend/`, `frontend/` y `docker-compose.yml`).
   Esto abre el monorepo completo como un unico workspace, lo cual esta bien
   para navegar y editar.
4. (Opcional, recomendado) Instala estas extensiones de VS Code para mejor
   soporte:
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Angular Language Service** (`Angular.ng-template`)
   - **Docker** (`ms-azuretools.vscode-docker`) — te permite ver/parar los
     contenedores desde la barra lateral.
5. VS Code va a detectar automaticamente los `tsconfig.json` de `backend/` y
   `frontend/`; el autocompletado e IntelliSense funcionan sin pasos extra.

> No hace falta correr `npm install` manualmente para *ver* el codigo — solo
> lo necesitas si queres ejecutar algo fuera de Docker (ver seccion 4).

---

## 2. Ejecutar todo con un solo comando (recomendado)

1. En la raiz del proyecto, copia el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Los valores por defecto ya funcionan para levantar el sistema. Si tenes
   credenciales de Mercado Pago (sandbox) o de Google Maps, cargalas en
   `MERCADOPAGO_ACCESS_TOKEN` y `GOOGLE_MAPS_API_KEY` dentro de `.env` (ver
   el detalle de cada variable en el propio archivo). Sin esas credenciales
   el resto del sistema funciona igual; solo el boton "Pagar sena" y el mapa
   embebido quedan con una degradacion controlada.

2. Desde la terminal integrada de VS Code (**Terminal → New Terminal**), en
   la raiz del proyecto:

   ```bash
   docker compose up --build
   ```

   Esto levanta 4 contenedores: `postgres`, `mailhog`, `backend` y
   `frontend`. La primera vez tarda unos minutos (build de las imagenes). El
   backend corre las migraciones de base de datos automaticamente al
   arrancar.

3. Una vez que veas en la terminal `Rentify backend escuchando en el puerto
   3000`, cargá los datos de ejemplo (propietario, administradores, clientes
   y propiedades de prueba) **en otra terminal**, sin bajar el compose:

   ```bash
   docker compose exec backend node dist/database/seeds/seed.js
   ```

   Al final del log te muestra los emails y contrasenas de prueba creados.

4. Abri en el navegador:

   | Servicio | URL |
   |---|---|
   | Aplicacion web (Angular) | http://localhost:4200 |
   | API / Swagger | http://localhost:3000/api/docs |
   | MailHog (ver emails enviados) | http://localhost:8025 |

5. Credenciales de prueba (creadas por el seed):

   | Rol | Email | Contrasena |
   |---|---|---|
   | Administrador (titular) | admin@rentify.local | Admin1234 |
   | Administrador (empleado) | empleado@rentify.local | Empleado1234 |
   | Cliente | abril.cliente@rentify.local | Cliente1234 |
   | Cliente | valentina.cliente@rentify.local | Cliente1234 |

6. Para parar todo: `Ctrl+C` en la terminal donde corre `docker compose up`,
   y despues `docker compose down` (agrega `-v` si tambien queres borrar los
   datos de la base: `docker compose down -v`).

---

## 3. Probar el pago con Mercado Pago (opcional)

El flujo de pago funciona contra el **entorno de pruebas (sandbox)** de
Mercado Pago:

1. Crea una cuenta de desarrollador y obtene un *Access Token* de prueba en
   https://www.mercadopago.com.ar/developers/panel/app
2. Cargalo en `.env` como `MERCADOPAGO_ACCESS_TOKEN` y reinicia el backend
   (`docker compose up -d --build backend`).
3. Reserva una propiedad como cliente, hace click en "Pagar sena" en *Mis
   reservas*, y usa una de las [tarjetas de prueba de Mercado
   Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)
   para simular el pago.
4. Mercado Pago notifica al backend via webhook (`/api/payments/webhook`) y
   la reserva pasa automaticamente a `CONFIRMED`.

> Nota: si probas esto en `localhost`, Mercado Pago no puede llegar a tu
> webhook local a menos que expongas el backend con una herramienta como
> [ngrok](https://ngrok.com/) y actualices `BACKEND_URL` en `.env` con esa
> URL publica. Sin webhook, la reserva queda "Pendiente de pago" hasta que
> el usuario vuelve a la pagina de resultado, que tambien reintenta
> consultar el estado.

---

## 4. Correr el proyecto sin Docker (desarrollo con recarga en caliente)

Util si queres editar el backend o el frontend y ver los cambios al instante
en VS Code, en lugar de reconstruir la imagen de Docker cada vez.

### 4.1. Base de datos y correo (via Docker, mas simple)

```bash
docker compose up -d postgres mailhog
```

Esto deja Postgres accesible en `localhost:5432` y MailHog en `localhost:8025`.

### 4.2. Backend

```bash
cd backend
npm install
cp .env.example .env        # ya viene configurado para apuntar a localhost:5432
npm run migration:run       # crea las tablas
npm run seed                # carga datos de ejemplo
npm run start:dev           # levanta con recarga en caliente en :3000
```

Desde VS Code podes abrir la carpeta `backend` en una ventana separada
(**File → Open Folder**) para tener el debugger de Node/NestJS mejor
integrado, o simplemente correr `npm run start:dev` desde la terminal
integrada con el workspace raiz abierto.

### 4.3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm start                   # equivalente a "ng serve", levanta en :4200
```

El frontend en modo desarrollo (`environment.ts`) ya apunta a
`http://localhost:3000/api`, asi que no necesita ningun proxy.

---

## 5. Tests

El backend incluye tests unitarios (calculo de noches/importes, reglas de
cancelacion de 72hs, login/registro):

```bash
cd backend
npm test
```

---

## 6. Comandos utiles (backend)

| Comando | Descripcion |
|---|---|
| `npm run start:dev` | Levanta la API con recarga en caliente |
| `npm run build` | Compila a `dist/` |
| `npm run migration:generate -- NombreMigracion` | Genera una migracion a partir de cambios en las entidades |
| `npm run migration:run` | Aplica migraciones pendientes |
| `npm run seed` | Carga datos de ejemplo (requiere `ts-node`, uso local) |
| `npm run lint` | Corre ESLint |
| `npm test` | Corre los tests unitarios |

## 7. Limitaciones conocidas / alcance

- El reembolso ante cancelacion se **registra** pero no ejecuta una
  devolucion real contra Mercado Pago (ver seccion de decisiones de diseno).
- El clima se obtiene de [Open-Meteo](https://open-meteo.com) (gratuito, sin
  API key) en lugar de un proveedor que requiera credenciales, para que el
  proyecto funcione "out of the box" sin configuracion adicional.
- Sin `GOOGLE_MAPS_API_KEY`, el detalle de la propiedad muestra un enlace a
  Google Maps en vez del mapa embebido (degradacion controlada, no rompe el
  flujo, tal como exige el requisito no funcional de integracion con
  servicios externos).
- Sin `MERCADOPAGO_ACCESS_TOKEN`, la creacion de la preferencia de pago
  devuelve un error controlado (503) en lugar de simular un pago falso.
