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
exports.onDelete = void 0;
const enums_1 = require("../enums");
const bot_1 = require("../bot");
function onDelete(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.delete} triggered`);
        const sender = ctx.from.id;
        const nameToDelete = ctx.message.text.substring(5).trim();
        const { error } = yield bot_1.supabase
            .from('birthdays')
            .delete()
            .eq('owner', sender)
            .eq('name', nameToDelete);
        if (!error) {
            bot_1.bot.api.sendMessage(sender, `${nameToDelete} rimosso con successo`, { parse_mode: 'HTML' });
        }
        else {
            console.log(`Error on supabase.from('birthdays').delete().eq('owner', ${sender}).eq('name', ${nameToDelete})`, error);
            bot_1.bot.api.sendMessage(sender, `Non ho trovato nessuno con nome "${nameToDelete}"`, {
                parse_mode: 'HTML',
            });
        }
    });
}
exports.onDelete = onDelete;
