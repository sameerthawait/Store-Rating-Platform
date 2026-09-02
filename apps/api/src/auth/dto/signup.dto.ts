import { ApiProperty } from '@nestjs/swagger';
import { USER_VALIDATION } from '@ratehub/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'User full name (20 to 60 characters)',
    example: 'Alexander Montgomery James',
    minLength: USER_VALIDATION.NAME_MIN_LENGTH,
    maxLength: USER_VALIDATION.NAME_MAX_LENGTH,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(USER_VALIDATION.NAME_MIN_LENGTH, {
    message: `Name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} characters long`,
  })
  @MaxLength(USER_VALIDATION.NAME_MAX_LENGTH, {
    message: `Name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@storerating.local',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({
    description: 'User physical address (maximum 400 characters)',
    example: '123 Meadowbrook Lane, Suite 400, Chicago, IL 60601',
    maxLength: USER_VALIDATION.ADDRESS_MAX_LENGTH,
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(USER_VALIDATION.ADDRESS_MAX_LENGTH, {
    message: `Address must not exceed ${USER_VALIDATION.ADDRESS_MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address: string;

  @ApiProperty({
    description:
      'Password (8-16 characters, at least 1 uppercase letter and at least 1 special character)',
    example: 'SecretP@ss123',
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: `Password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
  })
  @Matches(USER_VALIDATION.PASSWORD_REGEX, {
    message: USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE,
  })
  password: string;
}
