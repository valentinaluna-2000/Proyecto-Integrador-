import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PropertyImagesService } from './property-images.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('property-images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
@Controller('properties/:id/images')
export class PropertyImagesController {
  constructor(private imagesService: PropertyImagesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads/properties',
        filename: (_req, file, cb) => {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize:
          parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10) * 1024 * 1024,
      },
    }),
  )
  upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.imagesService.addImage(id, file, admin);
  }

  @Delete(':imageId')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.imagesService.removeImage(id, imageId, admin);
  }
}
