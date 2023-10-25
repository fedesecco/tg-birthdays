export enum Messages {
    Intro = `tbd`,
    Help = 'Nessun aiuto a ancora disponibile.',
    Unauthorized = 'Non sei autorizzato ad usare questo comando',
    WrongAddFormat = 'Il testo inviato non è nel formato corretto. Deve essere "gg/mm nome", tipo 03/04 Mario Rossi',
    TextTooLong = 'Il testo è troppo lungo',
    ErrorOnInsert = "Errore nell'aggiunta del dato :(",
}

export enum Commands {
    help = 'help',
    start = 'start',
    test = 'test',
    add = 'add',
    bdays = 'birthDaysOfTheDay',
}

export enum Chats {
    GruppoTest = -927488637,
    Anighiri = -924838476,
}

export enum People {
    Fede = 38455217,
}
export interface BdayRow {
    name: string;
    birthday: string;
}
