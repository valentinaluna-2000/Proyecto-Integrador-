import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class CredentialsDto { @IsEmail() email: string; @IsString() @MinLength(8) password: string; }
export class RegisterDto extends CredentialsDto { @IsString() nombre: string; @IsString() apellido: string; }
export class VerifyEmailDto { @IsEmail() email: string; @IsString() token: string; }
export class RecoverPasswordDto { @IsEmail() email: string; @IsOptional() @IsString() redirectTo?: string; }
export class UpdatePasswordDto { @IsString() @MinLength(8) password: string; }
