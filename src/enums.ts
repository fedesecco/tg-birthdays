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
    search = 'search',
    triggerBdays = 'today',
    subscribe = 'sub',
    unsubscribe = 'unsub',
}

export enum Requests {
    bdays = '/birthDaysOfTheDay',
    test = '/testCron',
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
    searchConversation = 'searchConversation',
}

export const monthToNumber: { [key: string]: string } = {
    Gennaio: '01',
    Febbraio: '02',
    Marzo: '03',
    Aprile: '04',
    Maggio: '05',
    Giugno: '06',
    Luglio: '07',
    Agosto: '08',
    Settembre: '09',
    Ottobre: '10',
    Novembre: '11',
    Dicembre: '12',
};

export const numberToMonth: { [key: string]: string } = {
    '01': 'Gennaio',
    '02': 'Febbraio',
    '03': 'Marzo',
    '04': 'Aprile',
    '05': 'Maggio',
    '06': 'Giugno',
    '07': 'Luglio',
    '08': 'Agosto',
    '09': 'Settembre',
    '10': 'Ottobre',
    '11': 'Novembre',
    '12': 'Dicembre',
};
