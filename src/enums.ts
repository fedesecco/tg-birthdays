import { ConversationFlavor, Conversation } from '@grammyjs/conversations';
import { Context } from 'grammy';

export type MyContext = Context & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

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
    bdays = 'birthDaysOfTheDay',
    triggerBdays = 'today',
    subscribe = 'sub',
    unsubscribe = 'unsub',
}

export enum Messages {
    Unauthorized = 'Non sei autorizzato ad usare questo comando',
    WrongAddFormat = 'Il testo inviato non è nel formato corretto. Deve essere "gg/mm nome", tipo 03/04 Mario Rossi',
    TextTooLong = 'Il testo è troppo lungo',
    ErrorOnRequest = 'Errore nella richiesta :(',
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
