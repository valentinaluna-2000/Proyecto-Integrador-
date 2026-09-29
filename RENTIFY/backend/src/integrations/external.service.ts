import { Injectable } from '@nestjs/common';
import { WeatherProvider, ILogicaUbicacionClima } from '../common/ports';
import { dates } from '../common/domain';
import { PropertiesService } from '../properties/properties.service';
@Injectable()
export class ExternalService implements ILogicaUbicacionClima {
  constructor(
    private properties: PropertiesService,
    private provider: WeatherProvider,
  ) {}
  async weather(id: number, from: string, to: string) {
    dates(from, to);
    const p = await this.properties.get(id);
    return this.provider.forecast(p.latitud, p.longitud, from, to);
  }
}
