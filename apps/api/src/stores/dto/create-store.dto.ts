import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_VALIDATION } from '@ratehub/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class InlineOwnerDto {
  @ApiProperty({
    description: 'Owner full name (20 to 60 characters)',
    example: 'Marcus Vance Tech Lead',
    minLength: USER_VALIDATION.NAME_MIN_LENGTH,
    maxLength: USER_VALIDATION.NAME_MAX_LENGTH,
  })
  @IsString({ message: 'Owner name must be a string' })
  @IsNotEmpty({ message: 'Owner name is required' })
  @MinLength(USER_VALIDATION.NAME_MIN_LENGTH, {
    message: `Owner name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} characters long`,
  })
  @MaxLength(USER_VALIDATION.NAME_MAX_LENGTH, {
    message: `Owner name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Owner login email address',
    example: 'owner.tech@storerating.local',
  })
  @IsEmail({}, { message: 'Please provide a valid owner email address' })
  @IsNotEmpty({ message: 'Owner email is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({
    description: 'Owner physical address (maximum 400 characters)',
    example: '100 Silicon Way, Tech District, San Francisco, CA',
    maxLength: USER_VALIDATION.ADDRESS_MAX_LENGTH,
  })
  @IsString({ message: 'Owner address must be a string' })
  @IsNotEmpty({ message: 'Owner address is required' })
  @MaxLength(USER_VALIDATION.ADDRESS_MAX_LENGTH, {
    message: `Owner address must not exceed ${USER_VALIDATION.ADDRESS_MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address: string;

  @ApiProperty({
    description:
      'Owner password (8-16 characters, at least 1 uppercase letter and at least 1 special character)',
    example: 'OwnerSecretP@ss1',
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: 'Owner password must be a string' })
  @IsNotEmpty({ message: 'Owner password is required' })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: `Owner password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: `Owner password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
  })
  @Matches(USER_VALIDATION.PASSWORD_REGEX, {
    message: USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE,
  })
  password: string;
}

export class CreateStoreDto {
  @ApiProperty({
    description: 'Store business name (20 to 60 characters)',
    example: 'Apex Electronics Superstore',
    minLength: 20,
    maxLength: 60,
  })
  @IsString({ message: 'Store name must be a string' })
  @IsNotEmpty({ message: 'Store name is required' })
  @MinLength(20, { message: 'Store name must be at least 20 characters long' })
  @MaxLength(60, { message: 'Store name must not exceed 60 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: 'Store contact email (distinct from owner login email)',
    example: 'contact@apexelectronics.com',
  })
  @IsEmail({}, { message: 'Please provide a valid store email address' })
  @IsNotEmpty({ message: 'Store email is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({
    description: 'Store physical address (maximum 400 characters)',
    example: '100 Silicon Way, Tech District, San Francisco, CA',
    maxLength: 400,
  })
  @IsString({ message: 'Store address must be a string' })
  @IsNotEmpty({ message: 'Store address is required' })
  @MaxLength(400, { message: 'Store address must not exceed 400 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address: string;

  @ApiPropertyOptional({
    description: 'ID of an existing user to assign as Store Owner',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Owner ID must be a valid UUID' })
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Inline Store Owner account details to create and assign in the same transaction',
    type: InlineOwnerDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InlineOwnerDto)
  owner?: InlineOwnerDto;
}
