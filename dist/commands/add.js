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
exports.addConversation = exports.onAdd = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
function onAdd(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.add} triggered`);
        const sender = ctx.from.id;
        const senderName = ctx.from.first_name;
        let { data, error } = yield bot_1.supabase.from('users').select('*');
        if (error)
            console.log('Error on supabase.from(users).select(): ', error);
        const userRows = data;
        const users = userRows.map((userRow) => userRow.id);
        if (!users.includes(sender)) {
            try {
                yield bot_1.supabase.from('users').insert([{ id: sender, name: senderName }]);
            }
            catch (error) {
                console.log("Error on supabase.from('users').insert: ", error);
                bot_1.bot.api.sendMessage(sender, enums_1.Messages.ErrorOnRequest);
            }
        }
        yield ctx.conversation.enter(enums_1.Convs.addConversation);
    });
}
exports.onAdd = onAdd;
function addConversation(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = ctx.from.id;
        yield ctx.reply('Chi vuoi aggiungere?');
        const inputName = yield askName(conversation, ctx);
        yield ctx.reply('In che giorno compie gli anni?', {
            reply_markup: {
                keyboard: dayButtons,
                one_time_keyboard: true,
            },
        });
        const inputDay = (yield conversation.waitFor(':text')).callbackQuery.data;
        yield ctx.reply('E che mese?', {
            reply_markup: {
                keyboard: monthButtons,
                one_time_keyboard: true,
            },
        });
        const inputMonth = (yield conversation.waitFor(':text')).callbackQuery.data;
        const inputDate = inputDay + '/' + inputMonth;
        try {
            yield bot_1.supabase
                .from('birthdays')
                .insert([{ name: inputName, birthday: inputDate, owner: sender }]);
            yield ctx.reply(`Aggiunto/a ${inputName} con compleanno il ${inputDay} ${inputMonth}`);
        }
        catch (error) {
            console.log("Error on supabase.from('birthdays').insert: ", error);
            yield ctx.reply(enums_1.Messages.ErrorOnRequest);
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
    return [{ text: day, callback_data: `${day}` }];
});
const monthButtons = [
    [{ text: 'Gennaio', callback_data: '01' }],
    [{ text: 'Febbraio', callback_data: '02' }],
    [{ text: 'Marzo', callback_data: '03' }],
    [{ text: 'Aprile', callback_data: '04' }],
    [{ text: 'Maggio', callback_data: '05' }],
    [{ text: 'Giugno', callback_data: '06' }],
    [{ text: 'Luglio', callback_data: '07' }],
    [{ text: 'Agosto', callback_data: '08' }],
    [{ text: 'Settembre', callback_data: '09' }],
    [{ text: 'Ottobre', callback_data: '10' }],
    [{ text: 'Novembre', callback_data: '11' }],
    [{ text: 'Dicembre', callback_data: '12' }],
];
