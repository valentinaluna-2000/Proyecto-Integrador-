import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, EmailDto, ProfileDto } from '../common/dtos';
import { AuthGuard, CurrentUser } from './security';
import { Actor } from '../common/domain';
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
  ) {}
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60000 } }) register(
    @Body() data: RegisterDto,
  ) {
    return this.auth.register(data);
  }
  @Post('resend-verification') @Throttle({ default: { limit: 3, ttl: 60000 } }) resend(
    @Body() data: EmailDto,
  ) {
    return this.auth.sendLink(data.email, false);
  }
  @Post('recover') @Throttle({ default: { limit: 3, ttl: 60000 } }) recover(
    @Body() data: EmailDto,
  ) {
    return this.auth.sendLink(data.email, true);
  }
  @Get('me') @ApiBearerAuth() @UseGuards(AuthGuard) me(@CurrentUser() user: Actor) {
    return this.users.me(user);
  }
  @Patch('me') @ApiBearerAuth() @UseGuards(AuthGuard) update(
    @CurrentUser() user: Actor,
    @Body() data: ProfileDto,
  ) {
    return this.users.update(user, data);
  }
}
