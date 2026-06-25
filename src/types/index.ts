export interface FlashcardPackage {
  id: number;
  name: string;
  description: string;
  category: string;
  cardCount: number;
  isPublic: boolean;
}

export interface CreatePackageRequest {
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
}