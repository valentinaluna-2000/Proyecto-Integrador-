# Autenticación y autorización

## Registro y verificación

1. `POST /auth/register` llega a `AuthController.register` (`backend/src/auth/auth.controller.ts`).
2. `AuthService.register` valida, bloquea por email, llama `SupabaseAuthAdapter.signup` (`integrations/supabase/supabase.adapter.ts`), guarda `Cliente` y un `Outbox` en la misma transacción.
3. `OutboxJob.flush` publica el tópico de verificación. `NotificadorEmail.verification` en el worker consume Kafka y `GmailSmtpEmailProvider` envía SMTP.
4. El enlace vuelve a `/auth/verificado`; `AuthPageComponent` comprueba Supabase y muestra login.

## Login, JWT y roles

`Auth.login` en `frontend/src/app/core.ts` llama `signInWithPassword`; luego `syncSession` pide `/auth/me`. El token JWT llega como `Authorization: Bearer`. `AuthGuard` (`backend/src/auth/security.ts`) valida identidad/verificación mediante `IAutenticacion.identity`, busca Cliente o Administrador y construye `Actor`; `RolesGuard` aplica `@Roles`.

`/auth/me` es el puente esencial: el JWT identifica a Supabase, pero el perfil y rol se resuelven en Rentify. `logout` llama `signOut`, borra la signal y navega al inicio.

## Contraseñas

En `/cuenta/contrasena`, `Auth.changePassword` usa `updateUser`, refresca sesión y vuelve a cargar `/auth/me`; el usuario continúa autenticado. En recovery, `AuthPageComponent` llama `completeRecoveryPassword`, actualiza la contraseña, hace `signOut` y navega a `/auth/login?passwordUpdated=1`. Son distintos porque el recovery usa una sesión temporal del enlace, no una sesión normal que deba conservarse.

Los guards Angular solo mejoran UX de navegación; la autoridad real es `AuthGuard` de Nest.
