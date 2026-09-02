import { ApiProperty } from '@nestjs/swagger';
import { Role, UserDto } from '@ratehub/shared';

export class UserResponseDto implements UserDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Alexander Montgomery James' })
  name: string;

  @ApiProperty({ example: 'user@storerating.local' })
  email: string;

  @ApiProperty({ example: '123 Meadowbrook Lane, Suite 400, Chicago, IL 60601' })
  address: string;

  @ApiProperty({ enum: Role, example: Role.NORMAL })
  role: Role;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' })
  updatedAt: Date;
}
