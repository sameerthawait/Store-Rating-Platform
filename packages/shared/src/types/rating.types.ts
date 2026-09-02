export interface RatingDto {
  id: string;
  userId: string;
  storeId: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreRaterDto {
  userId: string;
  name: string;
  rating: number;
  submittedAt: Date;
}
