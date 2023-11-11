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
exports.addConversation = exports.onTest = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
const utils_1 = require("../utils");
function onTest(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('/test triggered');
        const sender = ctx.from.id;
        if (!(0, utils_1.isAdmin)(sender)) {
            bot_1.bot.api.sendMessage(sender, enums_1.Messages.Unauthorized);
        }
        yield ctx.conversation.enter(enums_1.Convs.addConversation);
    });
}
exports.onTest = onTest;
function addConversation(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = ctx.from.id;
        yield ctx.reply('Chi vuoi aggiungere?');
        const inputName = yield askName(conversation, ctx);
        yield ctx.reply('In che giorno compie gli anni?', {
            reply_markup: {
                inline_keyboard: dayButtons,
            },
        });
        const inputDay = (yield conversation.waitFor(':text')).message.text;
        yield ctx.reply('E che mese?', {
            reply_markup: {
                inline_keyboard: dayButtons,
            },
        });
        const inputMonth = (yield conversation.waitFor(':text')).message.text;
        const inputDate = inputDay + '/' + inputMonth;
        try {
            yield bot_1.supabase
                .from('birthdays')
                .insert([{ name: inputName, birthday: inputDate, owner: sender }]);
            ctx.reply(`Aggiunto/a ${inputName} con compleanno il ${inputDate}`);
        }
        catch (error) {
            console.log("Error on supabase.from('birthdays').insert: ", error);
            ctx.reply(enums_1.Messages.ErrorOnRequest);
        }
    });
}
exports.addConversation = addConversation;
function askName(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = (yield conversation.waitFor(':text')).message.text;
        if (result.length > 50) {
            yield ctx.reply(`Name trppo lungo! Ho la memoria breve io. Re-inseriscilo`);
            result = yield askName(conversation, ctx);
        }
        return result;
    });
}
const dayButtons = Array.from({ length: 31 }, (_, index) => {
    const day = (index + 1).toString().padStart(2, '0');
    return [{ text: day, callback_data: `2023-01-${day}` }];
});
const monthButtons = [
    { text: 'January', callback_data: '01' },
    { text: 'February', callback_data: '02' },
    { text: 'March', callback_data: '03' },
    { text: 'April', callback_data: '04' },
    { text: 'May', callback_data: '05' },
    { text: 'June', callback_data: '06' },
    { text: 'July', callback_data: '07' },
    { text: 'August', callback_data: '08' },
    { text: 'September', callback_data: '09' },
    { text: 'October', callback_data: '10' },
    { text: 'November', callback_data: '11' },
    { text: 'December', callback_data: '12' },
];
