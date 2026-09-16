import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  @Get()
  findAll(@Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAllPublic(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOnePublic(id);
  }

  @Get(':id/availability')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.propertiesService.getAvailability(id, from, to);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() admin: JwtPayload) {
    return this.propertiesService.create(dto, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Get('admin/mine')
  findAllForAdmin(@CurrentUser() admin: JwtPayload) {
    return this.propertiesService.findAllForAdmin(admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Get('admin/mine/:id')
  findOneForAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.propertiesService.findOneForAdmin(id, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.propertiesService.update(id, dto, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: JwtPayload) {
    return this.propertiesService.deactivate(id, admin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: JwtPayload) {
    return this.propertiesService.activate(id, admin);
  }
}
