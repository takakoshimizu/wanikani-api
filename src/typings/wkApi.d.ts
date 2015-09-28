/// <reference path="./promise.d.ts" />

import {
    IApiResponse, IApiInformation, IUserInformation,
    IStudyQueue, ILevelProgress, ISRSDistribution,
    IRecentUnlock, ICriticalItem, ILeveledItem,
    IRadical, IKanji, IVocab } from './apiTypes';

export interface IWkApi {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    getLevelProgression(): Promise<ILevelProgress>;
    getSrsDistribution(): Promise<ISRSDistribution>;
    getRecentUnlocks(count: number): Promise<IRecentUnlock[]>;
    getCriticalItems(rate: number): Promise<ICriticalItem[]>;
    getRadicals(levels: number | number[]| string): Promise<IRadical[]>;
    getKanji(levels: number | number[]| string): Promise<IKanji[]>;
    getVocabulary(levels: number | number[]| string): Promise<IVocab[]>;
    setExpiry(time: number): void;
    setLevelsPerRequest(levels: number): void;
}