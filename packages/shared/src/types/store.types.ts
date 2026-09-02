export interface StoreDto {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId: string | null;
  averageRating: number | null;
  userRating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
