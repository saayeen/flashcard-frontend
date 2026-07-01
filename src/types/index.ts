export interface FlashcardPackage {
    id: number;
    name: string;
    description: string;
    category: string;
    cardCount: number;
    isPublic: boolean;
    theme: string;
    userId: string;
    tags: string[];
    forkedFromId?: number | null;
    originalAuthorId?: string | null;
}

export interface CreatePackageRequest {
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
    theme: string;
    tags: string[];
}

export interface UpdatePackageRequest {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    tags?: string[];
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

export interface GlobalStats {
    totalCardsReviewed: number;
    totalSessions: number;
    currentStreak: number;
    distribution: {
        difficult: number;
        almost: number;
        good: number;
        easy: number;
    };
}

export interface WeeklyActivity {
    day: string;
    cardsReviewed: number;
}