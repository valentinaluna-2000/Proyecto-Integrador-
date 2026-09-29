import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/security';
import { Actor, Rol } from '../common/domain';
import { ReserveDto, CancelDto } from '../common/dtos';
import { ReservationsService } from './reservations.service';
import { PaymentsService } from '../payments/payments.service';
import { CancellationsService } from '../cancellations/cancellations.service';
@ApiTags('Reservas')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(
    private reservations: ReservationsService,
    private payments: PaymentsService,
    private cancellations: CancellationsService,
  ) {}
  @Post() @Roles(Rol.CLIENTE) create(@CurrentUser() u: Actor, @Body() d: ReserveDto) {
    return this.reservations.create(u, d);
  }
  @Get('me') @Roles(Rol.CLIENTE) mine(@CurrentUser() u: Actor) {
    return this.reservations.list(u);
  }
  @Get(':id') detail(@CurrentUser() u: Actor, @Param('id', ParseIntPipe) id: number) {
    return this.reservations.detail(id, u);
  }
  @Post(':id/payment') @Roles(Rol.CLIENTE) payment(
    @CurrentUser() u: Actor,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.payments.checkout(id, u);
  }
  @Post(':id/cancel') @Roles(Rol.CLIENTE) cancel(
    @CurrentUser() u: Actor,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: CancelDto,
  ) {
    return this.cancellations.cancel(id, u, d);
  }
}
