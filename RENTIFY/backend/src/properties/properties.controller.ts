import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { AvailabilityService } from '../availability/availability.service';
import { ExternalService } from '../integrations/external.service';
import {
  FiltersDto,
  RangeDto,
  PropertyDto,
  UpdatePropertyDto,
  BlockDto,
  OrderDto,
} from '../common/dtos';
import { AuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/security';
import { Actor, Rol } from '../common/domain';
@ApiTags('Propiedades públicas')
@Controller('properties')
export class PropertiesController {
  constructor(
    private properties: PropertiesService,
    private availability: AvailabilityService,
    private external: ExternalService,
  ) {}
  @Get() list(@Query() query: FiltersDto) {
    return this.properties.list(query);
  }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number) {
    return this.properties.get(id);
  }
  @Get(':id/availability') available(@Param('id', ParseIntPipe) id: number, @Query() q: RangeDto) {
    return this.availability.check(id, q.fecha_desde, q.fecha_hasta);
  }
  @Get(':id/weather') weather(@Param('id', ParseIntPipe) id: number, @Query() q: RangeDto) {
    return this.external.weather(id, q.fecha_desde, q.fecha_hasta);
  }
}
@ApiTags('Administración de propiedades')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
@Controller('admin/properties')
export class AdminPropertiesController {
  constructor(private service: PropertiesService) {}
  @Get() list(@CurrentUser() u: Actor, @Query() q: FiltersDto) {
    return this.service.list(q, u);
  }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: Actor) {
    return this.service.get(id, u);
  }
  @Post() create(@CurrentUser() u: Actor, @Body() data: PropertyDto) {
    return this.service.create(u, data);
  }
  @Patch(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: Actor,
    @Body() data: UpdatePropertyDto,
  ) {
    return this.service.update(id, u, data);
  }
  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  image(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: Actor,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.image(id, u, file);
  }
  @Delete(':id/images/:imageId') removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() u: Actor,
  ) {
    return this.service.removeImage(id, imageId, u);
  }
  @Patch(':id/images/:imageId') orderImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() u: Actor,
    @Body() d: OrderDto,
  ) {
    return this.service.orderImage(id, imageId, u, d.orden);
  }
  @Get(':id/blocked-periods') blocks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: Actor,
  ) {
    return this.service.blocks(id, u);
  }
  @Post(':id/blocked-periods') block(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: Actor,
    @Body() d: BlockDto,
  ) {
    return this.service.block(id, u, d);
  }
  @Patch(':id/blocked-periods/:blockId') editBlock(
    @Param('id', ParseIntPipe) id: number,
    @Param('blockId', ParseIntPipe) blockId: number,
    @CurrentUser() u: Actor,
    @Body() d: BlockDto,
  ) {
    return this.service.block(id, u, d, blockId);
  }
  @Delete(':id/blocked-periods/:blockId') removeBlock(
    @Param('id', ParseIntPipe) id: number,
    @Param('blockId', ParseIntPipe) blockId: number,
    @CurrentUser() u: Actor,
  ) {
    return this.service.removeBlock(id, blockId, u);
  }
}
