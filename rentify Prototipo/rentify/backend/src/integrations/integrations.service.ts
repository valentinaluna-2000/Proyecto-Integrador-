import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private configService: ConfigService) {}

  getMapsConfig() {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    return {
      enabled: !!apiKey,
      apiKey: apiKey || null,
    };
  }

  /**
   * Consulta el pronostico meteorologico (Open-Meteo, sin necesidad de API
   * key, o el proveedor configurado via WEATHER_API_URL/WEATHER_API_KEY).
   * Nunca debe romper el flujo principal: si el servicio externo falla o
   * tarda demasiado, se devuelve una respuesta degradada.
   */
  async getWeather(lat: number, lon: number, fecha?: string) {
    const timeoutMs = 5000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Weather API respondio con status ${response.status}`);
      }
      const data = await response.json();

      let index = 0;
      if (fecha && data?.daily?.time) {
        const idx = data.daily.time.indexOf(fecha);
        if (idx >= 0) index = idx;
      }

      return {
        disponible: true,
        fecha: data?.daily?.time?.[index] || fecha,
        temperaturaMax: data?.daily?.temperature_2m_max?.[index] ?? null,
        temperaturaMin: data?.daily?.temperature_2m_min?.[index] ?? null,
        probabilidadPrecipitacion:
          data?.daily?.precipitation_probability_max?.[index] ?? null,
        codigoClima: data?.daily?.weathercode?.[index] ?? null,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener el pronostico meteorologico: ${(error as Error).message}`,
      );
      return {
        disponible: false,
        mensaje:
          'El servicio meteorologico no esta disponible en este momento. ' +
          'Podes continuar con la reserva sin problemas.',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
