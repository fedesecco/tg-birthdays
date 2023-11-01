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
exports.onAdd = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
function onAdd(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.add} triggered`);
        const sender = ctx.from.id;
        const senderName = ctx.from.first_name;
        let { data, error } = yield bot_1.supabase.from('users').select('*');
        if (error)
            console.log('Error on supabase.from(birthdays).select(): ', error);
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
        const inputText = ctx.message.text.substring(5);
        const inputDate = inputText.slice(0, 5);
        const inputDay0 = inputText.slice(0, 1);
        const inputDay1 = inputText.slice(1, 2);
        const inputDivider = inputText.slice(2, 3);
        const inputMonth0 = inputText.slice(3, 4);
        const inputMonth1 = inputText.slice(4, 5);
        const inputName = inputText.slice(5).trim();
        if (inputText.length > 36) {
            bot_1.bot.api.sendMessage(sender, enums_1.Messages.TextTooLong);
        }
        else if (!['0', '1', '2', '3'].includes(inputDay0) ||
            !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputDay1) ||
            !['0', '1'].includes(inputMonth0) ||
            !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inputMonth1) ||
            inputDivider != '/') {
            bot_1.bot.api.sendMessage(sender, enums_1.Messages.WrongAddFormat);
        }
        else {
            try {
                yield bot_1.supabase
                    .from('birthdays')
                    .insert([{ name: inputName, birthday: inputDate, owner: sender }]);
                bot_1.bot.api.sendMessage(sender, `Aggiunto/a ${inputName} con compleanno il ${inputDate}`);
            }
            catch (error) {
                console.log("Error on supabase.from('birthdays').insert: ", error);
                bot_1.bot.api.sendMessage(sender, enums_1.Messages.ErrorOnRequest);
            }
        }
    });
}
exports.onAdd = onAdd;
