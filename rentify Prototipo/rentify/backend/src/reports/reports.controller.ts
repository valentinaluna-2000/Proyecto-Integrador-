import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
@Controller('admin/reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  private filters(propertyId?: string, desde?: string, hasta?: string) {
    return {
      propertyId: propertyId ? parseInt(propertyId, 10) : undefined,
      desde,
      hasta,
    };
  }

  @Get('reservations')
  reservations(
    @CurrentUser() admin: JwtPayload,
    @Query('propertyId') propertyId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.reservationsReport(admin, this.filters(propertyId, desde, hasta));
  }

  @Get('revenue')
  revenue(
    @CurrentUser() admin: JwtPayload,
    @Query('propertyId') propertyId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.revenueReport(admin, this.filters(propertyId, desde, hasta));
  }

  @Get('occupancy')
  occupancy(
    @CurrentUser() admin: JwtPayload,
    @Query('propertyId') propertyId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.occupancyReport(admin, this.filters(propertyId, desde, hasta));
  }

  @Get('cancellations')
  cancellations(
    @CurrentUser() admin: JwtPayload,
    @Query('propertyId') propertyId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.cancellationsReport(admin, this.filters(propertyId, desde, hasta));
  }

  @Get('performance')
  performance(
    @CurrentUser() admin: JwtPayload,
    @Query('propertyId') propertyId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.performanceReport(admin, this.filters(propertyId, desde, hasta));
  }
}
