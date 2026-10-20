import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/security';
import { Actor, Rol } from '../common/domain';
import { PaginationDto, ReportDto, CancelDto } from '../common/dtos';
import { ReservationsService } from '../reservations/reservations.service';
import { PaymentsService } from '../payments/payments.service';
import { CancellationsService } from '../cancellations/cancellations.service';
import { ReportsService } from './reports.service';
@ApiTags('Gestión y reportes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
@Controller('admin')
export class AdminController {
  constructor(
    private reservations: ReservationsService,
    private payments: PaymentsService,
    private cancellations: CancellationsService,
    private reports: ReportsService,
  ) {}
  @Get('reservations') reservationsList(@CurrentUser() u: Actor, @Query() q: PaginationDto) {
    return this.reservations.list(u, q);
  }
  @Get('reservations/:id') detail(@CurrentUser() u: Actor, @Param('id', ParseIntPipe) id: number) {
    return this.reservations.detail(id, u);
  }
  @Post('reservations/:id/cancel') cancel(
    @CurrentUser() u: Actor,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: CancelDto,
  ) {
    return this.cancellations.cancel(id, u, d);
  }
  @Get('payments') paymentsList(@CurrentUser() u: Actor) {
    return this.payments.list(u);
  }
  @Get('cancellations') cancellationsList(@CurrentUser() u: Actor) {
    return this.cancellations.list(u);
  }
  @Get('reports/:kind') report(
    @CurrentUser() u: Actor,
    @Param('kind') kind: string,
    @Query() q: ReportDto,
  ) {
    return this.reports.report(kind, u, q);
  }
}
