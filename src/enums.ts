import { ConversationFlavor, Conversation } from '@grammyjs/conversations';
import { I18nFlavor } from '@grammyjs/i18n';
import { Context } from 'grammy';

export type MyContext = Context & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;
export type FullContext = Context & ConversationFlavor & I18nFlavor;

export enum Chats {
    GruppoTest = -927488637,
    Anighiri = -924838476,
}

export enum People {
    Fede = 38455217,
}

export const admins: number[] = [People.Fede];

export enum Commands {
    start = 'start',
    test = 'test',
    add = 'add',
    delete = 'remove',
    list = 'list',
    triggerBdays = 'today',
    subscribe = 'sub',
    unsubscribe = 'unsub',
}

export enum Requests {
    bdays = '/birthDaysOfTheDay',
    test = '/testCron',
}

export enum Tables {
    birthdays = 'birthdays',
    users = 'users',
}

export interface BdayRow {
    name: string;
    birthday: string;
    owner: number;
}

export enum UserRoles {
    ADMIN = 'ADMIN',
    PLEB = 'PLEB',
}

export enum UserStatus {
    SUBSCRIBED = 'SUBSCRIBED',
    PAUSED = 'PAUSED',
}

export interface UserRow {
    id: number;
    status?: UserStatus;
    role?: UserRoles;
    name?: string;
}

export enum Convs {
    addConversation = 'addConversation',
    deleteConversation = 'deleteConversation',
    findConversation = 'findConversation',
}
