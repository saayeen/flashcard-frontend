export interface FlashcardPackage {
    id: number;
    userId: string;
    name: string;
    description: string;
    category: string;
    cardCount: number;
    isPublic: boolean;
    theme: string;
    tags?: string[];
    forkedFromId?: number;
    originalAuthorId?: string;
    avgRating?: number;  
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

export interface Review {
    id: number;
    userId: string;
    packageId: number;
    rating: number;
    comment: string;
    userName: string;
    userPhotoUrl?: string | null;
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
    tags?: string[];
}

export interface UserResult {
    id: string;
    name: string;
    photoUrl?: string | null;
    description: string;
    packageCount: number;
}

export interface TagResult {
    tag: string;
    packageCount: number;
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