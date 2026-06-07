import { Context } from 'grammy';

export type MyContext = Context;

export enum Chats {
    GruppoTest = -927488637,
    Anighiri = -924838476,
}

export enum People {
    Fede = 38455217,
}

export const admins: number[] = [People.Fede];

export enum Requests {
    bdays = '/birthDaysOfTheDay',
    test = '/testCron',
    googleOAuthCallback = '/google/oauth/callback',
    telegramWebhook = '/telegram/webhook',
}
