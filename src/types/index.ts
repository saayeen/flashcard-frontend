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
    question: string;
    answer: string;
    packageId: number;
}

export interface CreateCardRequest {
    question: string;
    answer: string;
}

export interface Folder {
    id: number;
    name: string;
    color: string;
    userId: string;
}

export interface CreateFolderRequest {
    name: string;
    color: string;
}

export interface SearchResult {
    id: number;
    name: string;
    description: string;
    category: string;
    cardCount: number;
    authorName: string;
}