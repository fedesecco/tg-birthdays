export enum Messages {
    Intro = `Stop texting me, i am not your bot`,
    Help = 'Nessun aiuto a ancora disponibile.',
}

export enum Commands {
    help = 'help',
    start = 'start',
    test = 'test',
    bdays = 'birthDaysOfTheDay',
}

export enum Chats {
    GruppoTest = -927488637,
    Anighiri = -924838476,
}

export enum People {
    Fede = 38455217,
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            birthdays: {
                Row: {
                    birthday: string;
                    name: string;
                };
                Insert: {
                    birthday: string;
                    name?: string;
                };
                Update: {
                    birthday?: string;
                    name?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
