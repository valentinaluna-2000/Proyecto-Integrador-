import { Module } from '@nestjs/common';
import { SupabaseAuthService } from '../../business-non-persistent/supabase/supabase-auth.service';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({ controllers: [AuthController], providers: [SupabaseAuthService, SupabaseAuthGuard], exports: [SupabaseAuthGuard, SupabaseAuthService] })
export class AuthModule {}
