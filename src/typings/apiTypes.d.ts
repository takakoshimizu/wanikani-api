export interface IApiResponse<T> {
    userInformation: IUserInformation;
    requestedInformation: T;
}

export interface IApiInformation { }
export interface ILeveledItem {
    level: number;
}

export interface IUserInformation extends IApiInformation {
    username: string;
    gravatar: string;
    level: number;
    title: string;
    about: string;
    website: string;
    twitter: string;
    topicsCount: number;
    postsCount: number;
    creationDate: number;
    vacationDate: number;
}

export interface IStudyQueue extends IApiInformation {
    lessonsAvailable: number;
    reviewsAvaialble: number;
    nextReviewDate: number;
    reviewsAvailableNextHour: number;
    reviewsAvailableNextDay: number;
}

export interface ILevelProgress extends IApiInformation {
    radicalsProgress: number;
    radicalsTotal: number;
    kanjiProgress: number;
    kanjiTotal: number;
}

export interface ISRSDistributionItem {
    radicals: number;
    kanji: number;
    vocabulary: number;
    total: number;
}

export interface ISRSDistribution extends IApiInformation {
    apprentice: ISRSDistributionItem;
    guru: ISRSDistributionItem;
    master: ISRSDistributionItem;
    enlighten: ISRSDistributionItem;
    burned: ISRSDistributionItem;
}

export interface IRecentUnlock extends IApiInformation {
    type: string;
    character?: string;
    image?: string;
    meaning: string;
    kana?: string;
    onyomi?: string;
    kunyomi?: string;
    importantReading?: string;
    level: number;
    unlockedDate: number;
}

export interface ICriticalItem extends IRecentUnlock {
    percentage: number;
}

export interface IUserSpecific {
    srs: string;
    srsNumeric: number;
    unlockedDate: number;
    availableDate: number;
    burned: boolean;
    burnedDate?: number;
    meaningCorrect: number;
    meaningIncorrect: number;
    meaningMaxStreak: number;
    meaningCurrentStreak: number;
    readingCorrect: number;
    readingIncorrect: number;
    readingMaxStreak: number;
    readingCurrentStreak: number;
    meaningNote?: string;
    readingNote?: string;
    userSynonyms?: string;
}

export interface IRadical extends IApiInformation, ILeveledItem {
    character?: string;
    meaning: string;
    image?: string;
    userSpecific: IUserSpecific;
}

export interface IKanji extends IApiInformation, ILeveledItem {
    character: string;
    meaning: string;
    onyomi: string;
    kunyomi: string;
    importantReading: string;
    level: number;
    userSpecific: IUserSpecific;
}

export interface IVocab extends IApiInformation, ILeveledItem {
    character: string;
    kana: string;
    meaning: string;
    level: number;
    userSpecific: IUserSpecific;
}