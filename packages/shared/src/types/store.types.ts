export interface StoreDto {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  averageRating: number | null;
  userRating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
