"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToMonth = exports.monthToNumber = exports.Convs = exports.Messages = exports.Requests = exports.Commands = exports.admins = exports.People = exports.Chats = void 0;
var Chats;
(function (Chats) {
    Chats[Chats["GruppoTest"] = -927488637] = "GruppoTest";
    Chats[Chats["Anighiri"] = -924838476] = "Anighiri";
})(Chats = exports.Chats || (exports.Chats = {}));
var People;
(function (People) {
    People[People["Fede"] = 38455217] = "Fede";
})(People = exports.People || (exports.People = {}));
exports.admins = [People.Fede];
var Commands;
(function (Commands) {
    Commands["start"] = "start";
    Commands["test"] = "test";
    Commands["add"] = "add";
    Commands["delete"] = "remove";
    Commands["search"] = "search";
    Commands["triggerBdays"] = "today";
    Commands["subscribe"] = "sub";
    Commands["unsubscribe"] = "unsub";
})(Commands = exports.Commands || (exports.Commands = {}));
var Requests;
(function (Requests) {
    Requests["bdays"] = "/birthDaysOfTheDay";
    Requests["test"] = "/testCron";
})(Requests = exports.Requests || (exports.Requests = {}));
var Messages;
(function (Messages) {
    Messages["Unauthorized"] = "Non sei autorizzato ad usare questo comando";
    Messages["WrongAddFormat"] = "Il testo inviato non \u00E8 nel formato corretto. Deve essere \"gg/mm nome\", tipo 03/04 Mario Rossi";
    Messages["TextTooLong"] = "Il testo \u00E8 troppo lungo";
    Messages["ErrorOnRequest"] = "Errore nella richiesta :(";
})(Messages = exports.Messages || (exports.Messages = {}));
var Convs;
(function (Convs) {
    Convs["addConversation"] = "addConversation";
    Convs["deleteConversation"] = "deleteConversation";
    Convs["searchConversation"] = "searchConversation";
})(Convs = exports.Convs || (exports.Convs = {}));
exports.monthToNumber = {
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
exports.numberToMonth = {
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
