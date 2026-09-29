# Guía del repositorio

```text
RENTIFY/
├─ backend/                 API NestJS, worker y persistencia
│  ├─ src/app.module.ts     composición de módulos
│  ├─ src/main.ts           bootstrap HTTP/Swagger
│  ├─ src/worker.ts         consumidor Kafka/SMTP
│  ├─ src/{auth,reservations,payments,properties}/
│  ├─ src/persistence/      entidades, migración, seed, DataSource
│  └─ src/integrations/     Supabase, Kafka, MP, clima, email
├─ frontend/                SPA Angular
│  ├─ src/app/              rutas, páginas, servicios y calendario
│  ├─ src/styles.css        theme y estilos globales
│  ├─ public/branding/      logo Rentify
│  └─ Dockerfile, nginx.conf
├─ docs/                    documentación para desarrolladores
├─ docker-compose.yml       orquestación local
├─ README.md                operación y puesta en marcha
└─ DEMO-DATA.md             datos creados por el seed
```

`backend/src/app.module.ts` conecta controllers y providers. Cambiarlo altera qué dependencias puede inyectar Nest. `backend/src/common/ports.ts` define contratos para integraciones: modificar un contrato exige actualizar su adaptador y consumidores. `backend/src/persistence/migrations/1780000000000-Initial.ts` define el esquema real: nunca editar una migración ya aplicada para evolucionar producción; se agrega otra.

En frontend, `routes.ts` decide qué página carga una URL; `core.ts` contiene `Api`, `Auth` y guards; `catalog.ts`, `home.ts`, `account.ts` y `admin.ts` son pantallas. `calendar.ts` es componente visual y `calendar-domain.ts` contiene reglas puras de selección. Cambiar `styles.css` puede afectar todo el sitio porque concentra variables `--rentify-*`.

No se documentan `node_modules`, `dist`, `out-tsc` ni `work/pg-data`: son dependencias o artefactos generados, no fuente de verdad.
