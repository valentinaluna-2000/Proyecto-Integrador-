# Servicios externos

| Servicio | Rol real | Código |
|---|---|---|
| Supabase PostgreSQL | datos de dominio, TLS | `persistence/data-source.ts` |
| Supabase Auth | usuarios, JWT, enlaces | `integrations/supabase/supabase.adapter.ts` |
| Supabase Storage | fotos administradas | adaptador de almacenamiento en integraciones |
| Gmail SMTP | entrega final | `integrations/email/gmail.provider.ts` |
| Kafka | eventos y DLQ | `integrations/kafka/kafka.publisher.ts`, `worker.ts` |
| Mercado Pago | preference, pago y webhook TEST | `integrations/mercadopago/mercadopago.gateway.ts` |
| Open-Meteo | pronóstico cacheado 15 min | `integrations/weather/open-meteo.provider.ts` |
| Google Maps Embed | iframe opcional | `catalog.ts`, clave de `/config` |

El backend usa service role para operaciones administrativas de Auth/Storage; el navegador usa anon key para su sesión. Maps recibe coordenadas desde el navegador en un iframe; su clave debe restringirse por referer. Open-Meteo no bloquea reserva si falla. Mercado Pago recibe monto/refencia y devuelve checkout/pago; nunca se debe exponer su access token.
