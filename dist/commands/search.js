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
        yield ctx.conversation.enter(enums_1.Convs.searchConversation);
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
        const birthday = rawData.find((row) => row.display_name === nameToShowBday);
        if (!birthday) {
            yield ctx.reply(`Non ho trovato nessuno con nome "${nameToShowBday}"`);
            return;
        }
        const day = birthday.birth_day.toString().padStart(2, '0');
        const month = enums_1.numberToMonth[birthday.birth_month.toString().padStart(2, '0')];
        yield ctx.reply(`Il compleanno di ${nameToShowBday} e' il ${day} ${month}`);
    });
}
exports.searchConversation = searchConversation;
