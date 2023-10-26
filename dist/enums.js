"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRoles = exports.Messages = exports.Commands = exports.admins = exports.People = exports.Chats = void 0;
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
    Commands["help"] = "help";
    Commands["start"] = "start";
    Commands["test"] = "test";
    Commands["add"] = "add";
    Commands["bdays"] = "birthDaysOfTheDay";
})(Commands = exports.Commands || (exports.Commands = {}));
var Messages;
(function (Messages) {
    Messages["Intro"] = "tbd";
    Messages["Help"] = "Nessun aiuto a ancora disponibile.";
    Messages["Unauthorized"] = "Non sei autorizzato ad usare questo comando";
    Messages["WrongAddFormat"] = "Il testo inviato non \u00E8 nel formato corretto. Deve essere \"gg/mm nome\", tipo 03/04 Mario Rossi";
    Messages["TextTooLong"] = "Il testo \u00E8 troppo lungo";
    Messages["ErrorOnInsert"] = "Errore nell'aggiunta del dato :(";
})(Messages = exports.Messages || (exports.Messages = {}));
var UserRoles;
(function (UserRoles) {
    UserRoles["ADMIN"] = "ADMIN";
    UserRoles["PLEB"] = "PLEB";
})(UserRoles = exports.UserRoles || (exports.UserRoles = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["SUBSCRIBED"] = "SUBSCRIBED";
    UserStatus["PAUSED"] = "PAUSED";
})(UserStatus = exports.UserStatus || (exports.UserStatus = {}));
