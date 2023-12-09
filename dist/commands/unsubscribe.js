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
exports.onUnsubscribe = void 0;
const bot_1 = require("../bot");
const enums_1 = require("../enums");
function onUnsubscribe(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.unsubscribe} triggered`);
        const sender = ctx.from.id;
        let { data, error } = yield bot_1.supabase.from("users").select("*").eq("id", sender);
        if (error)
            console.log(`Error on from('users').select('*').eq('id', ${sender}): `, error);
        const user = data[0];
        if (user.status == "PAUSED") {
            yield ctx.reply("La tua iscrizione è già stata annullata!");
        }
        else if (user.status === "SUBSCRIBED") {
            const { error } = yield bot_1.supabase.from("users").update({ status: "PAUSED" }).eq("id", sender);
            if (error) {
                console.log(`Error on update: `, error);
                yield ctx.reply(enums_1.Messages.ErrorOnRequest);
            }
            else {
                yield ctx.reply("La tua iscrizione è stata annullata!");
            }
        }
    });
}
exports.onUnsubscribe = onUnsubscribe;
