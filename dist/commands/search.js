"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchConversation = exports.onSearch = void 0;
const enums_1 = require("../enums");
const utils_1 = require("../utils");
function onSearch(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.search} triggered`);
        yield ctx.conversation.enter(enums_1.Convs.deleteConversation);
    });
}
exports.onSearch = onSearch;
function searchConversation(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = ctx.from.id;
        const { keyboard, rawData } = yield (0, utils_1.getNamesTable)(sender);
        yield ctx.reply('Di chi vuoi vedere il compleanno?', {
            reply_markup: {
                keyboard: keyboard,
                one_time_keyboard: true,
            },
        });
        const nameToShowBday = (yield conversation.waitFor(':text')).message.text;
        const date = rawData.filter((row) => row.name === nameToShowBday).map((row) => row.birthday)[0];
        const day = date.substring(0, 2);
        const month = enums_1.numberToMonth[date.substring(3, 5)];
        yield ctx.reply(`Il compleanno di ${nameToShowBday} è il ${day} ${month}`);
    });
}
exports.searchConversation = searchConversation;
