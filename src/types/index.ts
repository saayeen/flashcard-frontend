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

export interface Flashcard {
    id: number;
    front: string;
    back: string;
    packageId: number;
}

export interface CreateCardRequest {
    question: string;
    answer: string;
}