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
exports.pauseUserOnUndeliverableMessage = void 0;
const grammy_1 = require("grammy");
const bot_1 = require("./bot");
function isDeliveryFailureToPause(error) {
    if (!(error instanceof grammy_1.GrammyError)) {
        return false;
    }
    const description = error.description.toLowerCase();
    return (description.includes("bot was blocked by the user") ||
        description.includes("user is deactivated") ||
        description.includes("chat not found") ||
        description.includes("bot was kicked") ||
        description.includes("have no rights to send a message"));
}
function pauseUserOnUndeliverableMessage(userId, error) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isDeliveryFailureToPause(error)) {
            throw error;
        }
        console.log(`Pausing user ${userId} after Telegram delivery failure`, error);
        const { error: updateError } = yield bot_1.supabase
            .from("users")
            .update({ status: "PAUSED" })
            .eq("id", userId);
        if (updateError) {
            console.log(`Error while pausing user ${userId}: `, updateError);
        }
    });
}
exports.pauseUserOnUndeliverableMessage = pauseUserOnUndeliverableMessage;
