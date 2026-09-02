import { Role } from '../enums/role.enum';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  address: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetailDto extends UserDto {
  store?: {
    id: string;
    name: string;
    address: string;
    averageRating: number | null;
  } | null;
}
