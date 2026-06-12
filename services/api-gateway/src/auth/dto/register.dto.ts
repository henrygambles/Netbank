import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @MinLength(1)
  firstName: string

  @IsString()
  @MinLength(1)
  lastName: string

  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone?: string
}
