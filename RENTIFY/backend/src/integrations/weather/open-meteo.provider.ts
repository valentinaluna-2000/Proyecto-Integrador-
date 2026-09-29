import { Injectable } from '@nestjs/common';
import { WeatherProvider } from '../../common/ports';
import { env } from '../../common/config';
import { DateTime } from 'luxon';
@Injectable()
export class OpenMeteoWeatherProvider extends WeatherProvider {
  private cache = new Map<string, { until: number; data: unknown }>();
  async forecast(lat: string, lon: string, from: string, to: string) {
    const start = DateTime.fromISO(from),
      end = DateTime.fromISO(to).minus({ days: 1 }),
      today = DateTime.now().startOf('day');
    if (start < today || end > today.plus({ days: 15 }))
      return {
        disponible: false,
        message: 'El pronóstico meteorológico todavía no está disponible para estas fechas.',
      };
    const key = [lat, lon, from, to].join(':');
    const cached = this.cache.get(key);
    if (cached && cached.until > Date.now()) return cached.data;
    try {
      const url = new URL('/v1/forecast', env('OPEN_METEO_BASE_URL', 'https://api.open-meteo.com'));
      url.search = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        start_date: from,
        end_date: end.toISODate()!,
        daily:
          'temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code,wind_speed_10m_max',
        timezone: 'America/Argentina/Cordoba',
      }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error();
      const body = await response.json();
      const data = { disponible: true, daily: body.daily };
      if (this.cache.size > 200) this.cache.clear();
      this.cache.set(key, { until: Date.now() + 15 * 60000, data });
      return data;
    } catch {
      return {
        disponible: false,
        message: 'El servicio meteorológico no está disponible temporalmente.',
      };
    }
  }
}
