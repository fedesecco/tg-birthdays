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
exports.deleteConversation = exports.onDelete = void 0;
const enums_1 = require("../enums");
const bot_1 = require("../bot");
const utils_1 = require("../utils");
function onDelete(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.delete} triggered`);
        yield ctx.conversation.enter(enums_1.Convs.deleteConversation);
    });
}
exports.onDelete = onDelete;
function deleteConversation(conversation, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = ctx.from.id;
        const namesToChooseFromKeyboard = yield (0, utils_1.getNamesTable)(sender);
        yield ctx.reply('Chi vuoi dimenticare?', {
            reply_markup: {
                keyboard: namesToChooseFromKeyboard,
                one_time_keyboard: true,
            },
        });
        const nameToDel = (yield conversation.waitFor(':text')).message.text;
        let { count, error } = yield bot_1.supabase
            .from('birthdays')
            .delete({ count: 'exact' })
            .eq('owner', sender)
            .eq('name', nameToDel);
        if (error) {
            console.log(`Error on supabase.from('birthdays').delete().eq('owner', ${sender}).eq('name', ${nameToDel})`, error);
            yield bot_1.bot.api.sendMessage(sender, enums_1.Messages.ErrorOnRequest);
        }
        else if (count && count > 0) {
            yield bot_1.bot.api.sendMessage(sender, `"${nameToDel}" rimosso con successo`);
        }
        else {
            console.log(`Count: ${count}`);
            yield bot_1.bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDel}"`);
        }
    });
}
exports.deleteConversation = deleteConversation;
