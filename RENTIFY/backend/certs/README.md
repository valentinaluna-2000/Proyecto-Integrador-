# CA pública de Supabase

`supabase-ca.crt` es un certificado público, no una clave privada.
Fuente HTTPS oficial utilizada por Supabase Studio:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

Referencia: https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json

Se agrega a las CA de Node manteniendo `rejectUnauthorized: true` y validación del hostname.
Si tu proyecto usa otra CA, descargala desde Database Settings → SSL Configuration,
guardala en esta carpeta y configurá `DATABASE_SSL_CA_FILE=certs/nombre.crt`.
La ruta se resuelve desde backend tanto localmente como dentro de Docker.
No guardes claves privadas en esta carpeta.
