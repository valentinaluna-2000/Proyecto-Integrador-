import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReservationsController {
  constructor(private service: ReservationsService) {}

  @Post('reservations')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENTE)
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get('reservations/simulate')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENTE)
  simulate(
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.service.simulate(propertyId, fechaDesde, fechaHasta);
  }

  @Get('reservations/my')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENTE)
  findMine(@Query() query: QueryReservationsDto, @CurrentUser() user: JwtPayload) {
    return this.service.findMine(user, query);
  }

  @Get('reservations/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }

  @Post('reservations/:id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cancel(id, dto, user);
  }

  @Get('admin/reservations')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findAllAdmin(@Query() query: QueryReservationsDto, @CurrentUser() admin: JwtPayload) {
    return this.service.findAllAdmin(admin, query);
  }
}
