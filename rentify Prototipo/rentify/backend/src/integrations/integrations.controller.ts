import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private service: IntegrationsService) {}

  @Get('maps/config')
  mapsConfig() {
    return this.service.getMapsConfig();
  }

  @Get('weather')
  weather(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.getWeather(parseFloat(lat), parseFloat(lon), fecha);
  }
}
