import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthService } from '../../business-non-persistent/supabase/supabase-auth.service';
import { CredentialsDto, RecoverPasswordDto, RegisterDto, UpdatePasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: SupabaseAuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) {
    // TODO: crear el perfil local Cliente vinculado al auth_user_id devuelto por Supabase.
    return this.auth.register(dto.email, dto.password, undefined, { nombre: dto.nombre, apellido: dto.apellido });
  }
  @Post('login') login(@Body() dto: CredentialsDto) { return this.auth.login(dto.email, dto.password); }
  @Post('verify-email') verifyEmail(@Body() dto: VerifyEmailDto) { return this.auth.verifyEmail(dto.email, dto.token); }
  @Post('recover-password') recover(@Body() dto: RecoverPasswordDto) { return this.auth.recoverPassword(dto.email, dto.redirectTo); }
  @UseGuards(SupabaseAuthGuard)
  @Post('update-password') updatePassword(@Body() dto: UpdatePasswordDto, @Req() request: Request) {
    return this.auth.updatePassword(this.accessToken(request), dto.password);
  }
  @UseGuards(SupabaseAuthGuard)
  @Post('logout') logout(@Req() request: Request) {
    return this.auth.logout(this.accessToken(request));
  }

  private accessToken(request: Request): string {
    return request.headers.authorization!.replace(/^Bearer\s+/i, '');
  }
}
