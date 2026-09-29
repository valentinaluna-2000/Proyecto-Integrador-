# Docker Compose

`docker compose up -d --build` construye imágenes frontend/backend, crea red/volumen y arranca servicios según `docker-compose.yml`. El backend recibe `.env` como secreto montado `/run/secrets/rentify_env`, no como código fuente.

- `kafka`: broker y volumen `kafka-data`; healthcheck espera topics CLI.
- `kafka-init`: crea topics con `--if-not-exists`; termina `Exited (0)` al finalizar.
- `migrate`: ejecuta `dist/persistence/initialize.js`; termina `Exited (0)` si no hay migraciones pendientes.
- `seed`: ejecuta seed idempotente; termina `Exited (0)` al terminar.
- `backend`: HTTP Nest en 3000, espera seed/Kafka.
- `worker`: consumidor Kafka/SMTP, espera backend/Kafka.
- `frontend`: Nginx sirve Angular en 4200 y hace proxy `/api`.

`depends_on` con `service_healthy` o `service_completed_successfully` ordena readiness; no sustituye la lógica de reintento de aplicaciones. Los Dockerfiles están en `backend/Dockerfile` y `frontend/Dockerfile`; `frontend/nginx.conf` define proxy/healthz. Los puertos se enlazan a `127.0.0.1`.

`docker compose down` detiene y borra contenedores/red, conserva volúmenes. `docker compose down -v` también borra `kafka-data`; se pierde el log local de Kafka. No usar `-v` para una prueba que necesite conservarlo.
