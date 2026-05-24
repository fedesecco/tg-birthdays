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
exports.onSync = void 0;
const google_1 = require("../google");
const enums_1 = require("../enums");
function onSync(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${enums_1.Commands.sync} triggered`);
        const sender = ctx.from.id;
        const senderName = ctx.from.first_name;
        const senderSurname = ctx.from.last_name;
        try {
            yield (0, google_1.ensureUserRecord)(sender, senderSurname ? `${senderName} ${senderSurname}` : senderName);
            if (!(yield (0, google_1.isGoogleConnected)(sender))) {
                const authUrl = (0, google_1.buildGoogleAuthUrl)(sender);
                yield ctx.reply(`Per sincronizzare i compleanni da Google devi prima collegare il tuo account.\n${authUrl}`);
                return;
            }
            const result = yield (0, google_1.syncGoogleContacts)(sender);
            for (const message of (0, google_1.formatGoogleSyncReport)(result)) {
                yield ctx.reply(message, { parse_mode: "HTML" });
            }
        }
        catch (error) {
            console.log("Error during /sync: ", error);
            const message = error instanceof Error ? error.message : "";
            if (message.includes("invalid_grant") || message.includes("Google account not connected")) {
                const authUrl = (0, google_1.buildGoogleAuthUrl)(sender);
                yield ctx.reply(`Il collegamento Google va rinnovato.\n${authUrl}`);
                return;
            }
            yield ctx.reply(enums_1.Messages.ErrorOnRequest);
        }
    });
}
exports.onSync = onSync;
