import { ApiProperty } from '@nestjs/swagger';
import { USER_VALIDATION } from '@ratehub/shared';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current account password for re-verification',
    example: 'OldPassword123!',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (8-16 characters, at least 1 uppercase letter and at least 1 special character)',
    example: 'NewPassword123!',
    minLength: USER_VALIDATION.PASSWORD_MIN_LENGTH,
    maxLength: USER_VALIDATION.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(USER_VALIDATION.PASSWORD_MIN_LENGTH, {
    message: `New password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
  })
  @MaxLength(USER_VALIDATION.PASSWORD_MAX_LENGTH, {
    message: `New password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
  })
  @Matches(USER_VALIDATION.PASSWORD_REGEX, {
    message: USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE,
  })
  newPassword: string;
}
