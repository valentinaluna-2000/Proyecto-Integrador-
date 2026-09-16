import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlockedPeriodsService } from './blocked-periods.service';
import { CreateBlockedPeriodDto } from './dto/create-blocked-period.dto';
import { UpdateBlockedPeriodDto } from './dto/update-blocked-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('blocked-periods')
@Controller()
export class BlockedPeriodsController {
  constructor(private service: BlockedPeriodsService) {}

  @Get('properties/:id/blocked-periods')
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.service.findAll(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Post('properties/:id/blocked-periods')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBlockedPeriodDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.service.create(id, dto, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Patch('blocked-periods/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlockedPeriodDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.service.updateById(id, dto, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Delete('blocked-periods/:id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: JwtPayload) {
    return this.service.removeById(id, admin);
  }
}
