export interface IApiResponse<T> {
    userInformation: IUserInformation;
    requestedInformation: T;
}

export interface IApiInformation {}

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